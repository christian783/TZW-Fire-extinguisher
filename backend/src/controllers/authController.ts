import User from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { generateToken } from "../utils/jwt";
import { compareOtpCode, createOtpExpiry, generateOtpCode, hashOtpCode, isOtpExpired } from "../utils/otp";
import { publishDomainEvent } from "../utils/domainEvents";

const buildOtpResponseData = (user, otpCode: string) => {
  const data: Record<string, unknown> = {
    userId: user.id,
    email: user.email,
    expiresAt: user.otpExpiresAt
  };

  if (process.env.NODE_ENV !== "production") {
    data.devOtp = otpCode;
  }

  return data;
};

const assignOtp = async (user) => {
  const otpCode = generateOtpCode();
  user.otpCodeHash = await hashOtpCode(otpCode);
  user.otpExpiresAt = createOtpExpiry();
  await user.save();

  return otpCode;
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

const register = async (req, res) => {
  const { firstName, lastName, email, password, role = "USER" } = req.body;
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
    role,
    emailVerified: false
  });

  const createdUser: any = await User.unscoped().findByPk((user as any).id);
  const otpCode = await assignOtp(createdUser);
  await syncUserProfile(createdUser);

  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully. Verify the OTP to activate the account.",
    data: buildOtpResponseData(createdUser, otpCode)
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

  return sendSuccess(res, {
    message: "A new OTP has been generated",
    data: buildOtpResponseData(user, otpCode)
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

  return sendSuccess(res, {
    message: "Password recovery OTP generated",
    data: buildOtpResponseData(user, otpCode)
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
