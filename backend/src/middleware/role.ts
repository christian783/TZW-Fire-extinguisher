import { AppError } from "./errorHandler";

export const ROLES = ["ADMIN", "INSPECTOR", "USER"] as const;
export type Role = (typeof ROLES)[number];

const isElevatedRole = (role?: Role) => role === "ADMIN" || role === "INSPECTOR";

const protect = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication is required", 401));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to access this resource", 403));
    }

    return next();
  };
};

export const canAccessOwnedRecord = (user, ownerId: string) => {
  if (!user) {
    return false;
  }

  return isElevatedRole(user.role) || user.id === ownerId;
};

export default protect;
