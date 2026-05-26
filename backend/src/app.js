const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const corsOptions = require("./config/cors");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: []
  });
});

app.use(errorHandler);

module.exports = app;
