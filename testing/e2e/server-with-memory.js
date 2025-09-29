const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { runSeeding } = require("../../seedContent");

(async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.PORT = process.env.PORT || "4173";
  process.env.NODE_ENV = process.env.NODE_ENV || "test";

  const appPath = path.resolve(__dirname, "../../src/app.js");
  const app = require(appPath);
  const startServer = app.startServer || require(appPath).startServer;
  const server = startServer ? startServer(Number(process.env.PORT)) : null;

  try {
    await runSeeding({ reuseConnection: true });
  } catch (err) {
    console.error("Seeding failed during server bootstrap:", err);
    await mongo.stop();
    process.exit(1);
  }

  const shutdown = async (code = 0) => {
    try {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await mongo.stop();
    } catch (err) {
      console.error("Shutdown error:", err);
    } finally {
      process.exit(code);
    }
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  process.on("uncaughtException", (err) => {
    console.error(err);
    shutdown(1);
  });
})();
