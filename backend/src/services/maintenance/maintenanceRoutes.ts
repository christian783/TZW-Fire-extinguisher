import express from "express";
import { body, param, query } from "express-validator";

import authenticate from "../../middleware/auth";
import protect from "../../middleware/role";
import validate from "../../middleware/validate";
import asyncHandler from "../../utils/asyncHandler";
import { EXTINGUISHER_STATUSES } from "../extinguishers/extinguisherModel";
import maintenanceController from "./maintenanceController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance Logging Service endpoints
 */

router.use(authenticate);

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     summary: List maintenance logs
 *     description: Returns paginated maintenance history and supports filtering by extinguisher or inspector.
 *     tags: [Maintenance]
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
 *         name: extinguisherId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: inspectorId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Maintenance logs fetched successfully
 *       422:
 *         description: Validation failed
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
    query("extinguisherId").optional().isUUID().withMessage("extinguisherId must be a UUID"),
    query("inspectorId").optional().isUUID().withMessage("inspectorId must be a UUID")
  ],
  validate,
  asyncHandler(maintenanceController.listMaintenanceLogs)
);

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     summary: Log maintenance activity
 *     description: Admins and Inspectors can log actions taken, issues identified, and recommendations for a fire extinguisher.
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/MaintenanceCreateRequest"
 *     responses:
 *       201:
 *         description: Maintenance activity logged successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can log maintenance
 *       404:
 *         description: Fire extinguisher not found
 *       422:
 *         description: Validation failed
 */
router.post(
  "/",
  protect("ADMIN", "INSPECTOR"),
  [
    body("extinguisherId").isUUID().withMessage("A valid extinguisherId is required"),
    body("actionTaken").trim().isLength({ min: 2, max: 5000 }).withMessage("actionTaken must be between 2 and 5000 characters"),
    body("maintenanceDate").isISO8601().withMessage("maintenanceDate must be a valid date"),
    body("issuesIdentified").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("issuesIdentified must be 5000 characters or less"),
    body("recommendations").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("recommendations must be 5000 characters or less"),
    body("nextStatus").optional().isIn(EXTINGUISHER_STATUSES).withMessage("nextStatus is not supported")
  ],
  validate,
  asyncHandler(maintenanceController.createMaintenanceLog)
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   get:
 *     summary: View maintenance log details
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Maintenance log fetched successfully
 *       404:
 *         description: Maintenance log not found
 *       422:
 *         description: Validation failed
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("A valid maintenance log id is required")],
  validate,
  asyncHandler(maintenanceController.getMaintenanceLog)
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   patch:
 *     summary: Update maintenance log
 *     tags: [Maintenance]
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
 *             $ref: "#/components/schemas/MaintenanceUpdateRequest"
 *     responses:
 *       200:
 *         description: Maintenance log updated successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can update maintenance
 *       404:
 *         description: Maintenance log not found
 *       422:
 *         description: Validation failed
 */
router.patch(
  "/:id",
  protect("ADMIN", "INSPECTOR"),
  [
    param("id").isUUID().withMessage("A valid maintenance log id is required"),
    body("actionTaken").optional().trim().isLength({ min: 2, max: 5000 }).withMessage("actionTaken must be between 2 and 5000 characters"),
    body("maintenanceDate").optional().isISO8601().withMessage("maintenanceDate must be a valid date"),
    body("issuesIdentified").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("issuesIdentified must be 5000 characters or less"),
    body("recommendations").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("recommendations must be 5000 characters or less")
  ],
  validate,
  asyncHandler(maintenanceController.updateMaintenanceLog)
);

/**
 * @swagger
 * /api/maintenance/{id}:
 *   delete:
 *     summary: Delete maintenance log
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Maintenance log deleted successfully
 *       403:
 *         description: Only ADMIN users can delete maintenance logs
 *       404:
 *         description: Maintenance log not found
 *       422:
 *         description: Validation failed
 */
router.delete(
  "/:id",
  protect("ADMIN"),
  [param("id").isUUID().withMessage("A valid maintenance log id is required")],
  validate,
  asyncHandler(maintenanceController.deleteMaintenanceLog)
);

export default router;
