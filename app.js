const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

const intitializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
intitializeDbAndServer();

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";

  const { search_q = "", priority, status } = request.query;

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriority(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      getTodoQuery = `
            SELECT * FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;

    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE
            todo LIKE '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

//Return a Specific Todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM
    todo
    WHERE
    id = ${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  response.send(todoResponse);
});

//Create Todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  const dbResponse = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo
app.put("/todos/:todoId/", async (request, response) => {
  const todoDetails = request.body;
  const { todoId } = request.params;
  let message = "";
  switch (true) {
    case todoDetails.status !== undefined:
      message = "Status";
      break;
    case todoDetails.priority !== undefined:
      message = "Priority";
      break;
    case todoDetails.todo !== undefined:
      message = "Todo";
      break;
  }
  const getPreviousTodoQuery = `
    SELECT * FROM
    todo
    WHERE
    id = ${todoId};`;
  const previousTodo = await db.get(getPreviousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
    UPDATE
    todo
    SET
    todo ='${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE
    id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${message} Updated`);
});

//Delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
