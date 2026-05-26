const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
const exampleEnvPath = path.join(__dirname, ".env.example");
const shouldUseExampleEnv = process.env.NODE_ENV !== "production" && !fs.existsSync(envPath);

dotenv.config({ path: shouldUseExampleEnv ? exampleEnvPath : envPath });

const app = require("./src/app");
const sequelize = require("./src/config/db");
const logger = require("./src/utils/logger");
require("./src/models/User");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established");

    await sequelize.sync({ alter: true });
    logger.info("Database models synchronized");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Failed to start server", { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
