import loadEnv from "../platform/loadEnv";

loadEnv();

const app = require("./app").default;
const logger = require("../utils/logger").default;

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`[api-gateway] Listening on port ${PORT}`);
  logger.info(`[api-gateway] Swagger docs available at http://localhost:${PORT}/api-docs`);
});
