import express from "express";

import authenticate from "../../middleware/auth";
import protect from "../../middleware/role";
import asyncHandler from "../../utils/asyncHandler";
import notificationController from "./notificationController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification Service endpoints for operational alerts
 */

router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List operational notifications
 *     description: Returns overdue inspection, upcoming expiration, and maintenance-required notifications generated from live operational data.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operational notifications fetched successfully
 *       401:
 *         description: Missing, invalid, or expired authentication token
 *       403:
 *         description: Only ADMIN or INSPECTOR users can access operational notifications
 */
router.get("/", protect("ADMIN", "INSPECTOR"), asyncHandler(notificationController.listNotifications));

export default router;
