import logger from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  errors: unknown[];
  isOperational: boolean;

  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

const normalizeSequelizeError = (error) => {
  if (error.name === "SequelizeUniqueConstraintError") {
    return new AppError("Resource already exists", 409, error.errors || []);
  }

  if (error.name === "SequelizeValidationError") {
    return new AppError("Validation failed", 422, error.errors || []);
  }

  return error;
};

const serializeErrors = (errors = []) => {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.map((error) => ({
    field: error.path || error.field || error.param,
    message: error.message || error.msg || "Invalid value"
  }));
};

const errorHandler = (error, req, res, next) => {
  const normalizedError = normalizeSequelizeError(error);
  const statusCode = normalizedError.statusCode || normalizedError.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error(normalizedError.message, {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    stack: normalizedError.stack
  });

  const response = {
    success: false,
    message: normalizedError.message || "Internal server error",
    errors: serializeErrors(normalizedError.errors)
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
