import loadEnv from "../../platform/loadEnv";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.NOTIFICATION_DB_NAME || "tzw_notification_db";
process.env.SERVICE_NAME = "notification-service";

const app = require("./app").default;
const startService = require("../../platform/startService").default;
const startNotificationEventConsumer = require("./eventConsumer").startNotificationEventConsumer;

(async () => {
  await startService({
    app,
    serviceName: "notification-service",
    port: process.env.NOTIFICATION_SERVICE_PORT || 5106
  });

  await startNotificationEventConsumer();
})();
