const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
require("./models/User");
require("./models/Article");
require("./models/Comment");
app.use(express.json());

app.use(cors());

const auth = require("./routes/api/auth");
const users = require("./routes/api/users");
const articles = require("./routes/api/articles");
const tags = require("./routes/api/tags");

mongoose.connect(
  "mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/ex-articles?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/articles", articles);
app.use("/api/tags", tags);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(__dirname + "/public/"));
  app.get(/.*/, (req, res) => res.sendFile(__dirname + "/public/index.html"));
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));

process.on("SIGINT", function() {
  mongoose.connection.close(function() {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});
