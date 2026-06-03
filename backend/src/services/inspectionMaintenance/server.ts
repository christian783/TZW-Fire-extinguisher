import loadEnv from "../../platform/loadEnv";

loadEnv();
process.env.SERVICE_DB_NAME = process.env.INSPECTION_MAINTENANCE_DB_NAME || "tzw_inspection_maintenance_db";
process.env.SERVICE_NAME = "inspection-maintenance-service";

require("../inspections/inspectionModel");
require("../maintenance/maintenanceModel");

const app = require("./app").default;
const startService = require("../../platform/startService").default;

startService({
  app,
  serviceName: "inspection-maintenance-service",
  port: process.env.INSPECTION_MAINTENANCE_SERVICE_PORT || 5104
});
