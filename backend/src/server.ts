import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = "127.0.0.1";

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const server = app.listen(PORT, HOST, () => {
  console.log(`LinkShort API: http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});

function shutdown(signal: string) {
  console.log(`\n${signal}: shutting down server...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing the server:", error);
      process.exitCode = 1;
    }

    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));