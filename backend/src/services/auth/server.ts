import loadEnv from "../../platform/loadEnv";
import logger from "../../utils/logger";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.AUTH_DB_NAME || "tzw_auth_db";
process.env.SERVICE_NAME = "auth-service";

logger.info("[auth-service] OTP email publishing is enabled", {
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
  notificationQueue: process.env.NOTIFICATION_QUEUE || "notification.email"
});

require("../../models/User");

const app = require("./app").default;
const startService = require("../../platform/startService").default;

startService({
  app,
  serviceName: "auth-service",
  port: process.env.AUTH_SERVICE_PORT || 5101
});
