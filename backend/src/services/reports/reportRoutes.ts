import express from "express";
import { param, query } from "express-validator";

import authenticate from "../../middleware/auth";
import protect from "../../middleware/role";
import validate from "../../middleware/validate";
import asyncHandler from "../../utils/asyncHandler";
import reportController from "./reportController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reporting Service endpoints for inventory, inspections, compliance, maintenance, and exports
 */

router.use(authenticate);
router.use(protect("ADMIN", "INSPECTOR"));

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get real-time dashboard report
 *     description: Aggregates inventory, inspection, compliance, and maintenance KPIs for the operations dashboard.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard report fetched successfully
 *       403:
 *         description: Only ADMIN or INSPECTOR users can access reports
 */
router.get("/dashboard", asyncHandler(reportController.dashboard));

/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: Get inventory report
 *     description: Includes total extinguisher count plus daily, monthly, yearly, status, and type summaries.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory report fetched successfully
 */
router.get("/inventory", asyncHandler(reportController.inventory));

/**
 * @swagger
 * /api/reports/inspections:
 *   get:
 *     summary: Get inspection report
 *     description: Includes pending, completed, and overdue inspection totals.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inspection report fetched successfully
 */
router.get("/inspections", asyncHandler(reportController.inspections));

/**
 * @swagger
 * /api/reports/compliance:
 *   get:
 *     summary: Get compliance report
 *     description: Includes expired extinguishers, upcoming expirations, and compliance percentage.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compliance report fetched successfully
 */
router.get("/compliance", asyncHandler(reportController.compliance));

/**
 * @swagger
 * /api/reports/maintenance:
 *   get:
 *     summary: Get maintenance report
 *     description: Includes maintenance history totals, frequency summary, and recent maintenance activity.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance report fetched successfully
 */
router.get("/maintenance", asyncHandler(reportController.maintenance));

/**
 * @swagger
 * /api/reports/{reportType}/export:
 *   get:
 *     summary: Export report
 *     description: Exports inventory, inspections, compliance, or maintenance report data as CSV or PDF.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [inventory, inspections, compliance, maintenance]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *       - in: query
 *         name: fromDate
 *         description: Optional ISO date displayed in the exported report period metadata.
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         description: Optional ISO date displayed in the exported report period metadata.
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Report export generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       422:
 *         description: Invalid reportType or export format
 */
router.get(
  "/:reportType/export",
  [
    param("reportType").isIn(["inventory", "inspections", "compliance", "maintenance"]).withMessage("reportType is not supported"),
    query("format").optional().isIn(["csv", "pdf"]).withMessage("format must be csv or pdf"),
    query("fromDate").optional({ checkFalsy: true }).isISO8601().withMessage("fromDate must be a valid ISO date"),
    query("toDate").optional({ checkFalsy: true }).isISO8601().withMessage("toDate must be a valid ISO date")
  ],
  validate,
  asyncHandler(reportController.exportReport)
);

export default router;
