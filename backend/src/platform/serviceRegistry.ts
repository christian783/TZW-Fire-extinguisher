export const serviceRegistry = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5101",
  users: process.env.USER_SERVICE_URL || "http://localhost:5102",
  extinguishers: process.env.EXTINGUISHER_SERVICE_URL || "http://localhost:5103",
  inspectionMaintenance: process.env.INSPECTION_MAINTENANCE_SERVICE_URL || "http://localhost:5104",
  reports: process.env.REPORTING_SERVICE_URL || "http://localhost:5105",
  notifications: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5106"
};
