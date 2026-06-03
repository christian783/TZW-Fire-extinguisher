import express from "express";
import { body, param, query } from "express-validator";

import authenticate from "../../middleware/auth";
import protect from "../../middleware/role";
import validate from "../../middleware/validate";
import asyncHandler from "../../utils/asyncHandler";
import extinguisherController from "./extinguisherController";
import { EXTINGUISHER_SIZES, EXTINGUISHER_STATUSES, EXTINGUISHER_TYPES } from "./extinguisherModel";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fire Extinguishers
 *   description: Fire Extinguisher Management Service endpoints
 */

router.use(authenticate);

/**
 * @swagger
 * /api/extinguishers:
 *   get:
 *     summary: List fire extinguishers
 *     description: Returns paginated extinguisher inventory records with optional status, type, and location filters.
 *     tags: [Fire Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, DUE_FOR_INSPECTION, MAINTENANCE_REQUIRED, EXPIRED, RETIRED] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [WATER, CO2, FOAM, DRY_CHEMICAL] }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fire extinguishers fetched successfully
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
 *                         extinguishers:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/FireExtinguisher"
 *       401:
 *         description: Missing, invalid, or expired authentication token
 *       422:
 *         description: Validation failed
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
    query("status").optional().isIn(EXTINGUISHER_STATUSES).withMessage("status is not supported"),
    query("type").optional().isIn(EXTINGUISHER_TYPES).withMessage("type is not supported"),
    query("location").optional().trim().isLength({ min: 2 }).withMessage("location filter must be at least 2 characters")
  ],
  validate,
  asyncHandler(extinguisherController.listExtinguishers)
);

/**
 * @swagger
 * /api/extinguishers:
 *   post:
 *     summary: Register a new fire extinguisher
 *     description: Admins and Inspectors can register inventory records with serial number, location, type, size, installation date, expiry date, and status.
 *     tags: [Fire Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/FireExtinguisherCreateRequest"
 *     responses:
 *       201:
 *         description: Fire extinguisher registered successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can register extinguishers
 *       409:
 *         description: Serial number already exists
 *       422:
 *         description: Validation failed
 */
router.post(
  "/",
  protect("ADMIN", "INSPECTOR"),
  [
    body("serialNumber").trim().isLength({ min: 2, max: 80 }).withMessage("serialNumber must be between 2 and 80 characters"),
    body("location").trim().isLength({ min: 2, max: 255 }).withMessage("location must be between 2 and 255 characters"),
    body("type").isIn(EXTINGUISHER_TYPES).withMessage("type must be WATER, CO2, FOAM, or DRY_CHEMICAL"),
    body("size").isIn(EXTINGUISHER_SIZES).withMessage("size must be 1.5 lb, 5 lb, 9 lb, or 12 lb"),
    body("installationDate").isISO8601().withMessage("installationDate must be a valid date"),
    body("expiryDate").isISO8601().withMessage("expiryDate must be a valid date"),
    body("status").optional().isIn(EXTINGUISHER_STATUSES).withMessage("status is not supported"),
    body("notes").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("notes must be 5000 characters or less")
  ],
  validate,
  asyncHandler(extinguisherController.createExtinguisher)
);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   get:
 *     summary: View fire extinguisher details
 *     tags: [Fire Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fire extinguisher fetched successfully
 *       404:
 *         description: Fire extinguisher not found
 *       422:
 *         description: Validation failed
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("A valid extinguisher id is required")],
  validate,
  asyncHandler(extinguisherController.getExtinguisher)
);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   patch:
 *     summary: Update fire extinguisher information
 *     tags: [Fire Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/FireExtinguisherUpdateRequest"
 *     responses:
 *       200:
 *         description: Fire extinguisher updated successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can update extinguishers
 *       404:
 *         description: Fire extinguisher not found
 *       422:
 *         description: Validation failed
 */
router.patch(
  "/:id",
  protect("ADMIN", "INSPECTOR"),
  [
    param("id").isUUID().withMessage("A valid extinguisher id is required"),
    body("serialNumber").optional().trim().isLength({ min: 2, max: 80 }).withMessage("serialNumber must be between 2 and 80 characters"),
    body("location").optional().trim().isLength({ min: 2, max: 255 }).withMessage("location must be between 2 and 255 characters"),
    body("type").optional().isIn(EXTINGUISHER_TYPES).withMessage("type must be WATER, CO2, FOAM, or DRY_CHEMICAL"),
    body("size").optional().isIn(EXTINGUISHER_SIZES).withMessage("size must be 1.5 lb, 5 lb, 9 lb, or 12 lb"),
    body("installationDate").optional().isISO8601().withMessage("installationDate must be a valid date"),
    body("expiryDate").optional().isISO8601().withMessage("expiryDate must be a valid date"),
    body("status").optional().isIn(EXTINGUISHER_STATUSES).withMessage("status is not supported"),
    body("notes").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("notes must be 5000 characters or less")
  ],
  validate,
  asyncHandler(extinguisherController.updateExtinguisher)
);

/**
 * @swagger
 * /api/extinguishers/{id}:
 *   delete:
 *     summary: Delete a fire extinguisher
 *     tags: [Fire Extinguishers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Fire extinguisher deleted successfully
 *       403:
 *         description: Only ADMIN users can delete extinguishers
 *       404:
 *         description: Fire extinguisher not found
 *       422:
 *         description: Validation failed
 */
router.delete(
  "/:id",
  protect("ADMIN"),
  [param("id").isUUID().withMessage("A valid extinguisher id is required")],
  validate,
  asyncHandler(extinguisherController.deleteExtinguisher)
);

export default router;
