export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found`, "NOT_FOUND", 404, { resource, id });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    return new AppError("Internal server error", "INTERNAL_ERROR", 500);
  }

  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500);
}