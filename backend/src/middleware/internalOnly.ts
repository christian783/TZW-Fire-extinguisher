import { AppError } from "./errorHandler";

const internalOnly = (req, res, next) => {
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    return next(new AppError("INTERNAL_SERVICE_TOKEN is required for internal routes", 500));
  }

  if (req.headers["x-internal-service-token"] !== expectedToken) {
    return next(new AppError("Internal service token is invalid", 403));
  }

  return next();
};

export default internalOnly;
