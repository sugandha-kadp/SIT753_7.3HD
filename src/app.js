const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "views", "components")));

// Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});
app.get("/courses", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "courses.html"));
});

// Client-side routing handles instructor gating for manage view
app.get("/courses/manage", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "courses.html"));
});

// API routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
const courseRoutes = require("./routes/courseRoutes");
app.use("/api/courses", courseRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected to:", mongoose.connection.db.databaseName);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

let server;
function startServer(port = PORT) {
  if (server) {
    return server;
  }

  server = app.listen(port, () => {
    const address = server.address();
    const resolvedPort = typeof address === "string" ? address : address?.port;
    console.log(`Server running at http://localhost:${resolvedPort ?? port}`);
  });

  app.locals.server = server;
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
