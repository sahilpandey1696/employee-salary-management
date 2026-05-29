import type { ErrorRequestHandler } from "express";
import { HttpError } from "../errors.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  response.status(500).json({ error: "Internal server error" });
};
