import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const loadEnv = () => {
  const envPath = path.join(process.cwd(), ".env");
  const exampleEnvPath = path.join(process.cwd(), ".env.example");
  const shouldUseExampleEnv = process.env.NODE_ENV !== "production" && !fs.existsSync(envPath);

  dotenv.config({ path: shouldUseExampleEnv ? exampleEnvPath : envPath });
};

export default loadEnv;
