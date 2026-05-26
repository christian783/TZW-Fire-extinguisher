const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { sendSuccess } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorHandler");

const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role: "USER"
  });

  const token = generateToken(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: {
      user,
      token
    }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.unscoped().findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      user,
      token
    }
  });
};

const me = async (req, res) => {
  return sendSuccess(res, {
    message: "Authenticated user fetched successfully",
    data: {
      user: req.user
    }
  });
};

module.exports = {
  register,
  login,
  me
};
