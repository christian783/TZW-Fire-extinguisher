import express from "express";
import { body, param, query } from "express-validator";

import authenticate from "../../middleware/auth";
import protect from "../../middleware/role";
import validate from "../../middleware/validate";
import asyncHandler from "../../utils/asyncHandler";
import inspectionController from "./inspectionController";
import { INSPECTION_RESULTS, INSPECTION_STATUSES } from "./inspectionModel";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Inspections
 *   description: Inspection Scheduling Service endpoints
 */

router.use(authenticate);

/**
 * @swagger
 * /api/inspections:
 *   get:
 *     summary: List scheduled inspections
 *     description: Returns paginated inspection schedules. USER accounts see inspections they requested; ADMIN and INSPECTOR accounts can monitor operational schedules.
 *     tags: [Inspections]
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
 *         schema: { type: string, enum: [SCHEDULED, COMPLETED, OVERDUE, CANCELLED] }
 *       - in: query
 *         name: extinguisherId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: inspectorId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Inspections fetched successfully
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
    query("status").optional().isIn(INSPECTION_STATUSES).withMessage("status is not supported"),
    query("extinguisherId").optional().isUUID().withMessage("extinguisherId must be a UUID"),
    query("inspectorId").optional().isUUID().withMessage("inspectorId must be a UUID")
  ],
  validate,
  asyncHandler(inspectionController.listInspections)
);

/**
 * @swagger
 * /api/inspections:
 *   post:
 *     summary: Schedule an inspection
 *     description: Schedules an inspection for a fire extinguisher, stores the requesting user, optionally assigns an inspector, and returns a notification payload for relevant personnel.
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InspectionScheduleRequest"
 *     responses:
 *       201:
 *         description: Inspection scheduled successfully
 *       404:
 *         description: Fire extinguisher not found
 *       422:
 *         description: Validation failed
 */
router.post(
  "/",
  [
    body("extinguisherId").isUUID().withMessage("A valid extinguisherId is required"),
    body("scheduledDate").isISO8601().withMessage("scheduledDate must be a valid date"),
    body("scheduledTime").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("scheduledTime must use HH:mm format"),
    body("inspectorId").optional({ nullable: true }).isUUID().withMessage("inspectorId must be a UUID"),
    body("notes").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("notes must be 5000 characters or less")
  ],
  validate,
  asyncHandler(inspectionController.scheduleInspection)
);

/**
 * @swagger
 * /api/inspections/{id}:
 *   get:
 *     summary: View inspection details
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Inspection fetched successfully
 *       404:
 *         description: Inspection not found
 *       422:
 *         description: Validation failed
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("A valid inspection id is required")],
  validate,
  asyncHandler(inspectionController.getInspection)
);

/**
 * @swagger
 * /api/inspections/{id}:
 *   patch:
 *     summary: Update inspection schedule or result
 *     description: Admins and Inspectors can reschedule inspections, assign inspectors, record results, findings, and recommendations.
 *     tags: [Inspections]
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
 *             $ref: "#/components/schemas/InspectionUpdateRequest"
 *     responses:
 *       200:
 *         description: Inspection updated successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can update inspections
 *       404:
 *         description: Inspection not found
 *       422:
 *         description: Validation failed
 */
router.patch(
  "/:id",
  protect("ADMIN", "INSPECTOR"),
  [
    param("id").isUUID().withMessage("A valid inspection id is required"),
    body("scheduledDate").optional().isISO8601().withMessage("scheduledDate must be a valid date"),
    body("scheduledTime").optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("scheduledTime must use HH:mm format"),
    body("status").optional().isIn(INSPECTION_STATUSES).withMessage("status is not supported"),
    body("result").optional({ nullable: true }).isIn(INSPECTION_RESULTS).withMessage("result must be PASS, FAIL, or NEEDS_MAINTENANCE"),
    body("findings").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("findings must be 5000 characters or less"),
    body("recommendations").optional({ nullable: true }).isLength({ max: 5000 }).withMessage("recommendations must be 5000 characters or less"),
    body("inspectorId").optional({ nullable: true }).isUUID().withMessage("inspectorId must be a UUID")
  ],
  validate,
  asyncHandler(inspectionController.updateInspection)
);

/**
 * @swagger
 * /api/inspections/{id}:
 *   delete:
 *     summary: Delete an inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Inspection deleted successfully
 *       403:
 *         description: Only ADMIN users can delete inspections
 *       404:
 *         description: Inspection not found
 *       422:
 *         description: Validation failed
 */
router.delete(
  "/:id",
  protect("ADMIN"),
  [param("id").isUUID().withMessage("A valid inspection id is required")],
  validate,
  asyncHandler(inspectionController.deleteInspection)
);

export default router;
