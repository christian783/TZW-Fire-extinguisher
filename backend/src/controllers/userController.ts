import User from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import paginate from "../utils/paginate";

const authServiceUrl = () => process.env.AUTH_SERVICE_URL || "http://localhost:5101";

const syncAuthUser = async (user) => {
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    throw new AppError("INTERNAL_SERVICE_TOKEN is required to synchronize auth users", 500);
  }

  const response = await fetch(new URL("/auth/internal/sync", authServiceUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-token": internalToken
    },
    body: JSON.stringify({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    })
  });

  if (!response.ok) {
    throw new AppError("Could not synchronize user changes with Auth Service", response.status);
  }
};

const listUsers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await paginate(User, { order: [["createdAt", "DESC"]] }, page, limit);

  return sendSuccess(res, {
    message: "Users fetched successfully",
    data: { users: result.data },
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  });
};

const applyUserProfileFields = (user, payload) => {
  ["id", "firstName", "lastName", "email", "role", "emailVerified"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      user[field] = payload[field];
    }
  });
};

const createSelfUserFromToken = async (req, userId: string) => {
  if (req.user.id !== userId) {
    return null;
  }

  const payload = {
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    role: req.user.role,
    emailVerified: true,
    password: `ExternalAuthOnly${Date.now()}!`
  };

  const existingByEmail: any = await User.findOne({ where: { email: req.user.email } });
  if (existingByEmail) {
    applyUserProfileFields(existingByEmail, payload);
    await existingByEmail.save();
    return existingByEmail;
  }

  return User.create(payload);
};

const syncUser = async (req, res) => {
  const payload = {
    id: req.body.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    role: req.body.role,
    emailVerified: Boolean(req.body.emailVerified),
    password: `ExternalAuthOnly${Date.now()}!`
  };

  let user: any = await User.findByPk(req.body.id);

  if (!user) {
    user = await User.findOne({ where: { email: String(req.body.email).toLowerCase().trim() } });
  }

  if (!user) {
    user = await User.create(payload);
  } else {
    applyUserProfileFields(user, payload);
  }

  await user.save();

  return sendSuccess(res, {
    message: "User profile synchronized successfully",
    data: { user }
  });
};

const getUser = async (req, res) => {
  let user: any = await User.findByPk(req.params.id);

  if (!user) {
    user = await createSelfUserFromToken(req, req.params.id);
  }

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.role !== "ADMIN" && req.user.id !== user.id) {
    throw new AppError("You do not have permission to access this user", 403);
  }

  return sendSuccess(res, {
    message: "User fetched successfully",
    data: { user }
  });
};

const updateUser = async (req, res) => {
  let user: any = await User.findByPk(req.params.id);

  if (!user) {
    user = await createSelfUserFromToken(req, req.params.id);
  }

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.role !== "ADMIN" && req.user.id !== user.id) {
    throw new AppError("You do not have permission to update this user", 403);
  }

  const allowedSelfFields = ["firstName", "lastName"];
  const allowedAdminFields = ["firstName", "lastName", "role", "emailVerified"];
  const allowedFields = req.user.role === "ADMIN" ? allowedAdminFields : allowedSelfFields;

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = req.body[field];
    }
  });

  await user.save();
  await syncAuthUser(user);

  return sendSuccess(res, {
    message: "User updated successfully",
    data: { user }
  });
};

const deleteUser = async (req, res) => {
  const user: any = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.id === user.id) {
    throw new AppError("Admins cannot delete their own account", 409);
  }

  await user.destroy();

  return sendSuccess(res, {
    message: "User deleted successfully",
    data: { id: req.params.id }
  });
};

export default {
  syncUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser
};
