const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let database;
const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

app.get("/todos/", async (request, response) => {
  const getQuery = request.query;
  let getDbList = "";
  let getAllDetails = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getDbList = `
      SELECT * FROM todo  WHERE status = '${getQuery.status}' AND priority = '${getQuery.priority}';`;
      getAllDetails = await database.all(getDbList);
      response.send(getAllDetails.map((eachItem) => outPutResult(eachItem)));
      break;
    case hasStatusProperty(request.query):
      if (getQuery.status === "TO DO") {
        getDbList = `select * from todo where status = '${getQuery.status}';`;
        getAllDetails = await database.all(getDbList);
        response.send(getAllDetails.map((eachItem) => outPutResult(eachItem)));
      }
      break;
    case hasPriorityProperty(request.query):
      if (getQuery.priority === "HIGH") {
        getDbList = `
      SELECT * FROM todo WHERE priority = '${getQuery.priority}';`;
        getAllDetails = await database.all(getDbList);
        response.send(getAllDetails.map((eachItem) => outPutResult(eachItem)));
      }
      break;
    case hasSearchProperty(request.query):
      getDbList = `select * from todo where todo like '%${getQuery.search_q}%';`;
      getAllDetails = await database.all(getDbList);
      response.send(getAllDetails.map((eachItem) => outPutResult(eachItem)));
      break;
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `select * from todo where id=${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  response.send(outPutResult(responseResult));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const postTodoQuery = `
  INSERT INTO
    todo (id, todo,priority, status)
  VALUES
    (${id}, '${todo}','${priority}', '${status}');`;
      await database.run(postTodoQuery);
      response.send("Todo Successfully Added");
    }
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}'
     WHERE id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Status Updated");
      break;

    case requestBody.priority !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`;

      await database.run(updateTodoQuery);
      response.send(`Priority Updated`);
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
