const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
///////////////////SERVER STARTED///////////////////

const checkRequestQueries = async (request, response, next) => {
  const { category, priority, status, date, search_q } = request.query;

  if (category !== undefined) {
    const possibleCategoryVals = ["HOME", "LEARNING", "WORK"];
    const categoryIsVaild = possibleCategoryVals.includes(category);
    if (categoryIsVaild) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (priority !== undefined) {
    const possiblePriorityVals = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsValid = possiblePriorityVals.includes(priority);
    if (priorityIsValid) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (status !== undefined) {
    const possibleStatusVals = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsValid = possibleStatusVals.includes(status);
    if (statusIsValid) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatedDate = format(myDate, "yyyy-MM-dd");
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);

      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.search_q = search_q;
  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

//GET TODO's API
app.get("/todos/", checkRequestQueries, async (request, response) => {
  const { category = "", priority = "", search_q = "", status = "" } = request;
  const getTodosQuery = `SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo WHERE (category LIKE "%${category}%" AND priority LIKE "%${priority}%" AND todo LIKE "%${search_q}%" AND status LIKE "%${status}%");`;
  const todosObj = await db.all(getTodosQuery);
  response.send(todosObj);
});

//GET TODO API
app.get("/todos/:todoId/", checkRequestQueries, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo where id=${todoId}`;
  const todoObj = await db.get(getTodoQuery);
  response.send(todoObj);
});

//GET TODO ON DATE API
app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request;
  const getDateQuery = `SELECT id, todo, priority, status, category, due_date AS dueDate  FROM todo WHERE due_date = "${date}";`;
  const dueDateObj = await db.all(getDateQuery);
  response.send(dueDateObj);
});

//POST TODO API
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;
  const addTodoQuery = `INSERT INTO todo VALUES(${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}")`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//PUT TODO API
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  let [req] = Object.keys(request.body);
  const val = request.body[req];
  if (req === "dueDate") {
    req = "due_date";
  }
  const { todoId } = request.params;
  const updateTodoQuery = `UPDATE todo SET ${req} = "${val}" WHERE id=${todoId};`;
  await db.run(updateTodoQuery);
  if (req === "due_date") {
    response.send("Due Date Updated");
  } else {
    response.send(`${req[0].toUpperCase()}${req.slice(1)} Updated`);
  }
});

//REMOVE TODO API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
