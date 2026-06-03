import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import corsOptions from "../config/cors";
import swaggerSpec from "../config/swagger";
import rateLimit from "../middleware/rateLimit";
import errorHandler from "../middleware/errorHandler";
import proxyToService from "../platform/proxy";
import { serviceRegistry } from "../platform/serviceRegistry";
import logger from "../utils/logger";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit);
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.http(`[api-gateway] ${message.trim()}`)
    }
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns a lightweight liveness response for the API gateway.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API gateway is healthy
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API gateway is healthy",
    data: {
      service: "api-gateway",
      uptime: process.uptime()
    },
    total: 0,
    page: 1,
    totalPages: 1
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", proxyToService(serviceRegistry.auth, "/api/auth", "/auth"));
app.use("/api/users", proxyToService(serviceRegistry.users, "/api/users", "/users"));
app.use("/api/extinguishers", proxyToService(serviceRegistry.extinguishers, "/api/extinguishers", "/extinguishers"));
app.use("/api/inspections", proxyToService(serviceRegistry.inspectionMaintenance, "/api/inspections", "/inspections"));
app.use("/api/maintenance", proxyToService(serviceRegistry.inspectionMaintenance, "/api/maintenance", "/maintenance"));
app.use("/api/reports", proxyToService(serviceRegistry.reports, "/api/reports", "/reports"));
app.use("/api/notifications", proxyToService(serviceRegistry.notifications, "/api/notifications", "/notifications"));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: []
  });
});

app.use(errorHandler);

export default app;
