import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { handleZodError } from "../errors/handleZodError";
import ApiError from "../errors/ApiError";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode: number = 500; // Default to internal server error
  const success = false;
  let message = err.message || "Something went wrong!";
  let errorMessage = "Something went wrong!";
  let errorDetails = err;

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode || 400; // Default to bad request if status code not provided
    message = simplifiedError?.message;
    errorDetails = simplifiedError?.errorDetails;
    errorMessage = simplifiedError?.errorMessage;
  } else if (err instanceof PrismaClientValidationError) {
    message = "Validation Error";
    errorDetails = err.message;
  } else if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Duplicate Key error";
      errorDetails = err.meta;
    }
  } else if (err instanceof ApiError) {
    statusCode = err?.statusCode;
    errorMessage = err.message;
    errorDetails = [
      {
        path: "",
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    errorMessage = err.message;
    errorDetails = [
      {
        path: "",
        message: err?.message,
      },
    ];
  }

  res.status(statusCode).json({
    success,
    message,
    errorMessage,
    errorDetails,
  });
};

export default globalErrorHandler;
