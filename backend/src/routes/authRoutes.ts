import express from "express";
import { body } from "express-validator";

import authController from "../controllers/authController";
import authenticate from "../middleware/auth";
import internalOnly from "../middleware/internalOnly";
import protect, { ROLES } from "../middleware/role";
import validate from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";

const router = express.Router();

const nameValidator = (field) =>
  body(field)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(`${field} must be between 2 and 100 characters`);

const passwordValidator = (field) =>
  body(field)
    .isLength({ min: 8, max: 128 })
    .withMessage(`${field} must be between 8 and 128 characters`)
    .matches(/[A-Z]/)
    .withMessage(`${field} must contain at least one uppercase letter`)
    .matches(/[a-z]/)
    .withMessage(`${field} must contain at least one lowercase letter`)
    .matches(/[0-9]/)
    .withMessage(`${field} must contain at least one number`);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/internal/sync:
 *   post:
 *     summary: Synchronize auth user profile from another service
 *     description: Internal service endpoint used by the User Service to keep Auth Service role and email verification state consistent across service databases.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-internal-service-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Internal service token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserUpdateRequest"
 *     responses:
 *       200:
 *         description: Auth user synchronized successfully
 *       403:
 *         description: Internal service token is invalid
 *       404:
 *         description: Auth user not found
 */
router.post("/internal/sync", internalOnly, asyncHandler(authController.syncUser));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user and issue a signup OTP
 *     description: Creates a test account with the selected role, keeps email verification disabled until OTP confirmation, and publishes an auth.otp_requested event so the Notification Service emails the OTP via Gmail SMTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RegisterRequest"
 *     responses:
 *       201:
 *         description: User registered successfully and OTP email queued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/OtpData"
 *       409:
 *         description: A user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 */
router.post(
  "/register",
  [
    nameValidator("firstName"),
    nameValidator("lastName"),
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    passwordValidator("password"),
    body("role").optional().isIn(ROLES).withMessage("role must be ADMIN, INSPECTOR, or USER")
  ],
  validate,
  asyncHandler(authController.register)
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify signup OTP and activate account
 *     description: Confirms the six-digit OTP sent during signup or resend, marks the account as verified, clears the stored OTP, and returns a JWT for immediate sign-in.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/VerifyOtpRequest"
 *     responses:
 *       200:
 *         description: Email verified successfully, or already verified
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AuthData"
 *       401:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       404:
 *         description: Verification request does not match a user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       410:
 *         description: OTP expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 */
router.post(
  "/verify-otp",
  [
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must contain only digits")
  ],
  validate,
  asyncHandler(authController.verifySignupOtp)
);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Generate a new signup OTP
 *     description: Replaces the pending signup OTP for an unverified user and publishes an auth.otp_requested event so the Notification Service emails the OTP via Gmail SMTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ResendOtpRequest"
 *     responses:
 *       200:
 *         description: OTP regenerated and email queued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/OtpData"
 *       404:
 *         description: Verification request does not match a user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       409:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 */
router.post(
  "/resend-otp",
  [body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail()],
  validate,
  asyncHandler(authController.resendSignupOtp)
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: Authenticates a verified user and returns a JWT bearer token plus the current user profile.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LoginRequest"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/AuthData"
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Email has not been verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 */
router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  asyncHandler(authController.login)
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the authenticated user
 *     description: Returns the user associated with the supplied JWT. ADMIN, INSPECTOR, and USER roles can access this endpoint.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/StandardSuccessResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: "#/components/schemas/User"
 *       401:
 *         description: Invalid or expired authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Authenticated user does not have an allowed role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 */
router.get("/me", authenticate, protect("ADMIN", "INSPECTOR", "USER"), validate, asyncHandler(authController.me));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     description: Stateless JWT logout endpoint. Clients should discard the bearer token after a successful response.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Missing, invalid, or expired authentication token
 */
router.post("/logout", authenticate, protect("ADMIN", "INSPECTOR", "USER"), asyncHandler(authController.logout));

/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: Validate bearer token
 *     description: Confirms that the supplied JWT is valid and returns the decoded authenticated user profile.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Missing, invalid, or expired authentication token
 */
router.get("/validate-token", authenticate, protect("ADMIN", "INSPECTOR", "USER"), asyncHandler(authController.validateToken));

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change authenticated user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChangePasswordRequest"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect or token is invalid
 *       422:
 *         description: Validation failed
 */
router.patch(
  "/change-password",
  authenticate,
  protect("ADMIN", "INSPECTOR", "USER"),
  [
    body("currentPassword").notEmpty().withMessage("currentPassword is required"),
    passwordValidator("newPassword")
  ],
  validate,
  asyncHandler(authController.changePassword)
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request forgotten password recovery OTP
 *     description: Generates a password recovery OTP when the email exists and publishes an auth.otp_requested event so the Notification Service emails the OTP via Gmail SMTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ResendOtpRequest"
 *     responses:
 *       200:
 *         description: Password recovery OTP email queued when the email exists
 *       422:
 *         description: Validation failed
 */
router.post(
  "/forgot-password",
  [body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail()],
  validate,
  asyncHandler(authController.forgotPassword)
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with recovery OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ResetPasswordRequest"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Invalid OTP
 *       410:
 *         description: Password recovery OTP expired
 *       422:
 *         description: Validation failed
 */
router.post(
  "/reset-password",
  [
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must contain only digits"),
    passwordValidator("password")
  ],
  validate,
  asyncHandler(authController.resetPassword)
);

export default router;
