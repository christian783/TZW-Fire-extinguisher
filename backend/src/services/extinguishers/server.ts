import loadEnv from "../../platform/loadEnv";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.EXTINGUISHER_DB_NAME || "tzw_extinguisher_db";
process.env.SERVICE_NAME = "fire-extinguisher-service";

require("./extinguisherModel");

const app = require("./app").default;
const startService = require("../../platform/startService").default;

startService({
  app,
  serviceName: "fire-extinguisher-service",
  port: process.env.EXTINGUISHER_SERVICE_PORT || 5103
});
