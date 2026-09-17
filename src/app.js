const express = require("express");
const helmet = require("helmet");

const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

// Creates and configures the Express application used by server.js and tests.
const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Provides a lightweight endpoint for health checks and deployment probes.
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "InsuredMine assessment API is running"
  });
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
