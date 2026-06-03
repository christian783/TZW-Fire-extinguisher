import { AppError } from "./errorHandler";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 300);

const buckets = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    return next(new AppError("Too many requests. Please try again later.", 429));
  }

  return next();
};

export default rateLimit;
