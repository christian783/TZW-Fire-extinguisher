import loadEnv from "../../platform/loadEnv";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.USER_DB_NAME || "tzw_user_db";
process.env.SERVICE_NAME = "user-service";

require("../../models/User");

const app = require("./app").default;
const startService = require("../../platform/startService").default;

startService({
  app,
  serviceName: "user-service",
  port: process.env.USER_SERVICE_PORT || 5102
});
