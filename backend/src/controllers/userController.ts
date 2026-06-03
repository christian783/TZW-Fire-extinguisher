import User from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import paginate from "../utils/paginate";

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

const syncUser = async (req, res) => {
  const [user] = await User.findOrCreate({
    where: { id: req.body.id },
    defaults: {
      id: req.body.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      role: req.body.role,
      emailVerified: Boolean(req.body.emailVerified),
      password: `ExternalAuthOnly${Date.now()}!`
    }
  });

  ["firstName", "lastName", "email", "role", "emailVerified"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  return sendSuccess(res, {
    message: "User profile synchronized successfully",
    data: { user }
  });
};

const getUser = async (req, res) => {
  const user: any = await User.findByPk(req.params.id);

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
  const user: any = await User.findByPk(req.params.id);

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
