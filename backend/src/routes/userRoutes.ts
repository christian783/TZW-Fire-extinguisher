import express from "express";
import { body, param, query } from "express-validator";

import userController from "../controllers/userController";
import authenticate from "../middleware/auth";
import internalOnly from "../middleware/internalOnly";
import protect, { ROLES } from "../middleware/role";
import validate from "../middleware/validate";
import asyncHandler from "../utils/asyncHandler";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: RBAC user management endpoints
 */

router.post("/internal/sync", internalOnly, asyncHandler(userController.syncUser));

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     description: Admin-only endpoint that returns paginated user accounts ordered by creation date.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to fetch.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page.
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/User"
 *       401:
 *         description: Missing, invalid, or expired authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Only ADMIN users can list accounts
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
router.get(
  "/",
  protect("ADMIN"),
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
  ],
  validate,
  asyncHandler(userController.listUsers)
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     description: Returns a user profile. ADMIN users can read any profile; non-admin users can read only their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User id.
 *     responses:
 *       200:
 *         description: User fetched successfully
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
 *         description: Missing, invalid, or expired authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Authenticated user cannot access this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       404:
 *         description: User not found
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
router.get(
  "/:id",
  [param("id").isUUID().withMessage("A valid user id is required")],
  validate,
  asyncHandler(userController.getUser)
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: Updates a user profile. ADMIN users can update firstName, lastName, role, and emailVerified; non-admin users can update only firstName and lastName on their own profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserUpdateRequest"
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *         description: Missing, invalid, or expired authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Authenticated user cannot update this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       404:
 *         description: User not found
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
router.patch(
  "/:id",
  [
    param("id").isUUID().withMessage("A valid user id is required"),
    body("firstName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("firstName must be between 2 and 100 characters"),
    body("lastName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("lastName must be between 2 and 100 characters"),
    body("role").optional().isIn(ROLES).withMessage("role must be ADMIN, INSPECTOR, or USER"),
    body("emailVerified").optional().isBoolean().withMessage("emailVerified must be a boolean")
  ],
  validate,
  asyncHandler(userController.updateUser)
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Admin-only endpoint that deletes a user account. Admins cannot delete their own account.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User id.
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                         id:
 *                           type: string
 *                           format: uuid
 *       401:
 *         description: Missing, invalid, or expired authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       403:
 *         description: Only ADMIN users can delete accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StandardErrorResponse"
 *       409:
 *         description: Admin attempted to delete their own account
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
router.delete(
  "/:id",
  protect("ADMIN"),
  [param("id").isUUID().withMessage("A valid user id is required")],
  validate,
  asyncHandler(userController.deleteUser)
);

export default router;
