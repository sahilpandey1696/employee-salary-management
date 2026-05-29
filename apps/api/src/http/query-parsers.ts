import { BadRequestError } from "./errors.js";

export function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseOptionalInteger(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} must be a valid integer`);
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new BadRequestError(`${field} must be a valid integer`);
  }

  return parsed;
}
