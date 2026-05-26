const { AppError } = require("./errorHandler");

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

module.exports = protect;
