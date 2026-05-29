import { Prisma } from "@prisma/client";
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(409).json({ error: uniqueConstraintMessage(error.meta?.target) });
      return;
    }
  }

  response.status(500).json({ error: "Internal server error" });
};

function uniqueConstraintMessage(target: unknown): string {
  const fields = formatUniqueTarget(target)?.split(",") ?? [];

  if (fields.includes("email")) {
    return "This work email is already in use.";
  }
  if (fields.includes("phone")) {
    return "This phone number is already in use.";
  }
  if (fields.includes("employeeNumber")) {
    return "This employee code is already in use. Refresh the form for a new code.";
  }

  return "A record with these details already exists.";
}

function formatUniqueTarget(target: unknown): string | undefined {
  if (Array.isArray(target)) {
    return target.map(String).join(",");
  }
  if (typeof target === "string") {
    return target;
  }
  return undefined;
}
