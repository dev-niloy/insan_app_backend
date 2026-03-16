import express, { Application, Response } from "express";
import cors from "cors";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { createServer } from "http";
import { CORS_OPTIONS } from "./config/config";
import { API_RESPONSES } from "./constants/apiResponses";

const app: Application = express();

const main_server = createServer(app);

app.use(cors(CORS_OPTIONS));
app.use(cookieParser());
app.use(
  express.json({
    limit: "100mb",
  }),
);
app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
  }),
);

// the root route
app.get("/", (_, res: Response) => {
  return API_RESPONSES.forbidden(
    res,
    "Access denied. Insufficient permissions!",
  );
});
app.use("/api", router);

// not found route handler
app.use((_, res: Response) => {
  return API_RESPONSES.notFound(res, "API NOT FOUND!");
});

// global error handler
app.use(globalErrorHandler);

export default main_server;
