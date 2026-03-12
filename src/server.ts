/* eslint-disable no-console */
import "dotenv/config";
import { Server } from "http";
import config from "./config";
import main_server from "./app";
import "./types/global";

async function main() {
  try {
    // 2. starting the server AFTER seeders succeed
    const server: Server = main_server.listen(config.port, () => {
      console.log("Server is running on port ", config.port);
    });

    // 3. graceful shutdown logic
    const exitHandler = () => {
      server.close(() => {
        console.info("Server closed!");
        process.exit(1);
      });
    };

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      exitHandler();
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error);
      exitHandler();
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

main();
