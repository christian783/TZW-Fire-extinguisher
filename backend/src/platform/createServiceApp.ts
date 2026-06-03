import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import corsOptions from "../config/cors";
import errorHandler from "../middleware/errorHandler";
import logger from "../utils/logger";

type RouteMount = {
  path: string;
  router: any;
};

const createServiceApp = (serviceName: string, routes: RouteMount[] = []) => {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.http(`[${serviceName}] ${message.trim()}`)
      }
    })
  );

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: `${serviceName} is healthy`,
      data: {
        service: serviceName,
        uptime: process.uptime()
      },
      total: 0,
      page: 1,
      totalPages: 1
    });
  });

  routes.forEach((route) => {
    app.use(route.path, route.router);
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found on ${serviceName}`,
      errors: []
    });
  });

  app.use(errorHandler);

  return app;
};

export default createServiceApp;
