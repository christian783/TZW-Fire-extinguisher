import { verifyToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Authentication token is required", 401);
    }

    const decoded: any = verifyToken(token);

    req.user = {
      id: decoded.id,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      role: decoded.role
    };
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired authentication token", 401));
    }

    return next(error);
  }
};

export default authenticate;
