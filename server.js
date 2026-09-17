require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { startCpuMonitor, stopCpuMonitor } = require("./src/utils/cpuMonitor");
const { startScheduler, stopScheduler } = require("./src/services/scheduler.service");

const PORT = Number(process.env.PORT || 3000);

// Connects dependencies, starts HTTP/background services, and handles shutdown.
async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    startCpuMonitor(server);
    startScheduler();

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);

      stopCpuMonitor();
      stopScheduler();

      server.close(async () => {
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
