import loadEnv from "../../platform/loadEnv";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.REPORTING_DB_NAME || "tzw_reporting_db";
process.env.SERVICE_NAME = "reporting-service";

const app = require("./app").default;
const startService = require("../../platform/startService").default;

startService({
  app,
  serviceName: "reporting-service",
  port: process.env.REPORTING_SERVICE_PORT || 5105
});
