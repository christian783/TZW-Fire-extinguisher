import sequelize from "../config/db";
import logger from "../utils/logger";

type StartServiceOptions = {
  app: any;
  serviceName: string;
  port: number | string;
  syncDatabase?: boolean;
};

const startService = async ({ app, serviceName, port, syncDatabase = true }: StartServiceOptions) => {
  try {
    if (syncDatabase) {
      await sequelize.authenticate();
      logger.info(`[${serviceName}] Database connection established`);

      await sequelize.sync({ alter: true });
      logger.info(`[${serviceName}] Database models synchronized`);
    }

    app.listen(port, () => {
      logger.info(`[${serviceName}] Listening on port ${port}`);
    });
  } catch (error) {
    logger.error(`[${serviceName}] Failed to start`, { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

export default startService;
