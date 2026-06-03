import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import corsOptions from "./config/cors";
import swaggerSpec from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import extinguisherRoutes from "./services/extinguishers/extinguisherRoutes";
import inspectionRoutes from "./services/inspections/inspectionRoutes";
import maintenanceRoutes from "./services/maintenance/maintenanceRoutes";
import notificationRoutes from "./services/notifications/notificationRoutes";
import reportRoutes from "./services/reports/reportRoutes";
import logger from "./utils/logger";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns a lightweight liveness response for uptime checks, load balancers, and deployment probes.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                           format: float
 *                           example: 123.45
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    data: { uptime: process.uptime() },
    total: 0,
    page: 1,
    totalPages: 1
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/extinguishers", extinguisherRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: []
  });
});

app.use(errorHandler);

export default app;
