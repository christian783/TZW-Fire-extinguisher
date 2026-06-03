import User from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { generateToken } from "../utils/jwt";
import { compareOtpCode, createOtpExpiry, generateOtpCode, hashOtpCode, isOtpExpired } from "../utils/otp";
import { publishDomainEvent } from "../utils/domainEvents";
import { publishRabbitEvent } from "../platform/rabbitmq";
import logger from "../utils/logger";

const buildOtpResponseData = (user) => {
  return {
    userId: user.id,
    email: user.email,
    expiresAt: user.otpExpiresAt
  };
};

const assignOtp = async (user) => {
  const otpCode = generateOtpCode();
  user.otpCodeHash = await hashOtpCode(otpCode);
  user.otpExpiresAt = createOtpExpiry();
  await user.save();

  return otpCode;
};

const publishOtpEmail = async (user, otpCode: string, purpose: "signup" | "signup-resend" | "password-recovery") => {
  try {
    await publishRabbitEvent({
      type: "auth.otp_requested",
      occurredAt: new Date().toISOString(),
      payload: {
        recipientEmail: user.email,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        otpCode,
        expiresAt: user.otpExpiresAt,
        purpose
      }
    });
    logger.info("[auth-service] OTP email event queued", {
      userId: user.id,
      email: user.email,
      purpose
    });
  } catch (error) {
    logger.error("[auth-service] OTP email event publish failed", {
      userId: user.id,
      email: user.email,
      purpose,
      message: error.message
    });
    throw new AppError("Could not queue OTP email. Please make sure RabbitMQ and the Notification Service are running.", 503);
  }
};

const syncUserProfile = async (user) => {
  const userServiceUrl = process.env.USER_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!userServiceUrl) {
    return;
  }

  try {
    await fetch(new URL("/users/internal/sync", userServiceUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(internalToken ? { "x-internal-service-token": internalToken } : {})
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
  } catch (error) {
    await publishDomainEvent("user.registered", {
      userId: user.id,
      email: user.email,
      role: user.role
    });
  }
};

const syncUser = async (req, res) => {
  const user: any = await User.unscoped().findOne({
    where: req.body.id ? { id: req.body.id } : { email: String(req.body.email).toLowerCase().trim() }
  });

  if (!user) {
    throw new AppError("Auth user not found for synchronization", 404);
  }

  ["firstName", "lastName", "email", "role", "emailVerified"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = req.body[field];
    }
  });

  if (req.body.emailVerified) {
    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    user.otpVerifiedAt = user.otpVerifiedAt || new Date();
  }

  await user.save();

  return sendSuccess(res, {
    message: "Auth user synchronized successfully",
    data: { user }
  });
};

const register = async (req, res) => {
  const { firstName, lastName, email, password, role = "USER" } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  logger.info("[auth-service] Register request received", {
    email: normalizedEmail,
    role
  });

  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    logger.info("[auth-service] Register request rejected because email already exists", {
      email: normalizedEmail
    });
    throw new AppError("A user with this email already exists", 409);
  }

  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password,
    role,
    emailVerified: false
  });

  const createdUser: any = await User.unscoped().findByPk((user as any).id);
  const otpCode = await assignOtp(createdUser);
  await publishOtpEmail(createdUser, otpCode, "signup");
  await syncUserProfile(createdUser);

  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully. Check your email for the OTP to activate the account.",
    data: buildOtpResponseData(createdUser)
  });
};

const verifySignupOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user: any = await User.unscoped().findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("Invalid verification request", 404);
  }

  if (user.emailVerified) {
    const token = generateToken(user);

    return sendSuccess(res, {
      message: "Email is already verified",
      data: {
        user,
        token
      }
    });
  }

  if (!user.otpCodeHash || isOtpExpired(user.otpExpiresAt)) {
    throw new AppError("OTP has expired. Please request a new code.", 410);
  }

  const isValidOtp = await compareOtpCode(String(otp), user.otpCodeHash);
  if (!isValidOtp) {
    throw new AppError("Invalid OTP", 401);
  }

  user.emailVerified = true;
  user.otpVerifiedAt = new Date();
  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  await user.save();
  await syncUserProfile(user);

  const token = generateToken(user);

  return sendSuccess(res, {
    message: "Email verified successfully",
    data: {
      user,
      token
    }
  });
};

const resendSignupOtp = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user: any = await User.unscoped().findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("Invalid verification request", 404);
  }

  if (user.emailVerified) {
    throw new AppError("This email is already verified", 409);
  }

  const otpCode = await assignOtp(user);
  await publishOtpEmail(user, otpCode, "signup-resend");

  return sendSuccess(res, {
    message: "A new OTP has been sent to your email",
    data: buildOtpResponseData(user)
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).toLowerCase().trim();

  const user: any = await User.unscoped().findOne({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before signing in", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

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

const logout = async (req, res) => {
  return sendSuccess(res, {
    message: "Logout successful. Remove the token from the client session.",
    data: { userId: req.user.id }
  });
};

const validateToken = async (req, res) => {
  return sendSuccess(res, {
    message: "Token is valid",
    data: {
      user: req.user
    }
  });
};

const changePassword = async (req, res) => {
  const user: any = await User.unscoped().findByPk(req.user.id);

  if (!user) {
    throw new AppError("Authenticated user not found", 404);
  }

  const isPasswordValid = await user.comparePassword(req.body.currentPassword);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  return sendSuccess(res, {
    message: "Password changed successfully",
    data: { userId: user.id }
  });
};

const forgotPassword = async (req, res) => {
  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const user: any = await User.unscoped().findOne({ where: { email: normalizedEmail } });

  if (!user) {
    return sendSuccess(res, {
      message: "If the email exists, a recovery OTP will be generated",
      data: { email: normalizedEmail }
    });
  }

  const otpCode = await assignOtp(user);
  await publishOtpEmail(user, otpCode, "password-recovery");

  return sendSuccess(res, {
    message: "Password recovery OTP sent to your email",
    data: buildOtpResponseData(user)
  });
};

const resetPassword = async (req, res) => {
  const normalizedEmail = String(req.body.email).toLowerCase().trim();
  const user: any = await User.unscoped().findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw new AppError("Invalid password recovery request", 404);
  }

  if (!user.otpCodeHash || isOtpExpired(user.otpExpiresAt)) {
    throw new AppError("Password recovery OTP has expired. Please request a new code.", 410);
  }

  const isValidOtp = await compareOtpCode(String(req.body.otp), user.otpCodeHash);
  if (!isValidOtp) {
    throw new AppError("Invalid OTP", 401);
  }

  user.password = req.body.password;
  user.otpCodeHash = null;
  user.otpExpiresAt = null;
  await user.save();

  return sendSuccess(res, {
    message: "Password reset successfully",
    data: { userId: user.id }
  });
};

export default {
  syncUser,
  register,
  verifySignupOtp,
  resendSignupOtp,
  login,
  me,
  logout,
  validateToken,
  changePassword,
  forgotPassword,
  resetPassword
};
