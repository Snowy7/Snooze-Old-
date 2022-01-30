const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Setup Cors Origin
app.use(require("cors")());
app.get("/", (req, res) => {
  res.send("GGG");
});

//Setup Routes
app.use("/user", require("./routes/user"));
app.use("/chat", require("./routes/chatroom"));

//Setup Error Handlers
const errorHandlers = require("./handlers/errorsHandler");
app.use(errorHandlers.notFound);
app.use(errorHandlers.mongoseErrors);
if (process.env.ENV === "DEV") {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;
