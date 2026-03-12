import { CorsOptions } from "cors";

const whitelist: string[] = process.env?.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((url) => url.trim())
  : ["*"];

export const CORS_OPTIONS: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: [
    "auth",
    "Content-Type",
    "Authorization",
    "x-platform",
    "x-api-token",
    "Accept",
    "Origin",
    "X-Requested-With",
  ],
};
