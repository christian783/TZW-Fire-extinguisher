import { Op } from "sequelize";

import { AppError } from "../../middleware/errorHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { publishDomainEvent } from "../../utils/domainEvents";
import paginate from "../../utils/paginate";
import { fetchServiceJson, getAuthorizationHeader, sendServiceJson } from "../../utils/serviceClient";
import { buildInspectionScheduledNotification } from "../notifications/notificationService";
import Inspection from "./inspectionModel";

const extinguisherServiceUrl = () => process.env.EXTINGUISHER_SERVICE_URL || "http://localhost:5103";

const applyUserScope = (req, where: Record<string, unknown>) => {
  if (req.user.role === "USER") {
    where.requestedById = req.user.id;
  }
};

const listInspections = async (req, res) => {
  const { page = 1, limit = 10, status, extinguisherId, inspectorId } = req.query;
  const where: Record<string, unknown> = {};

  applyUserScope(req, where);

  if (status) {
    where.status = status;
  }

  if (extinguisherId) {
    where.extinguisherId = extinguisherId;
  }

  if (inspectorId) {
    where.inspectorId = inspectorId;
  }

  const result = await paginate(
    Inspection,
    {
      where,
      order: [["scheduledDate", "ASC"], ["scheduledTime", "ASC"]]
    },
    page,
    limit
  );

  return sendSuccess(res, {
    message: "Inspections fetched successfully",
    data: { inspections: result.data },
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  });
};

const scheduleInspection = async (req, res) => {
  const extinguisherResponse = await fetchServiceJson(new URL(`/extinguishers/${req.body.extinguisherId}`, extinguisherServiceUrl()), getAuthorizationHeader(req));
  const extinguisher = extinguisherResponse.data?.extinguisher;

  const inspection = await Inspection.create({
    extinguisherId: req.body.extinguisherId,
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime,
    inspectorId: req.body.inspectorId || null,
    requestedById: req.user.id,
    status: "SCHEDULED",
    findings: req.body.notes || null
  });

  const notification = buildInspectionScheduledNotification(inspection as any, extinguisher);
  await publishDomainEvent("inspection.scheduled", {
    ...notification,
    recipientEmail: req.user.email
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Inspection scheduled successfully",
    data: { inspection, notification }
  });
};

const getInspection = async (req, res) => {
  const where: Record<string, unknown> = { id: req.params.id };
  applyUserScope(req, where);

  const inspection = await Inspection.findOne({ where });

  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  return sendSuccess(res, {
    message: "Inspection fetched successfully",
    data: { inspection }
  });
};

const updateInspection = async (req, res) => {
  const inspection: any = await Inspection.findByPk(req.params.id);

  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  ["scheduledDate", "scheduledTime", "status", "result", "findings", "recommendations", "inspectorId"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      inspection[field] = req.body[field];
    }
  });

  if (req.body.status === "COMPLETED" || req.body.result) {
    inspection.status = "COMPLETED";
    inspection.completedAt = inspection.completedAt || new Date();
  }

  await inspection.save();

  if (inspection.result === "FAIL" || inspection.result === "NEEDS_MAINTENANCE") {
    await sendServiceJson(
      new URL(`/extinguishers/${inspection.extinguisherId}`, extinguisherServiceUrl()),
      "PATCH",
      { status: "MAINTENANCE_REQUIRED" },
      getAuthorizationHeader(req)
    );
    await publishDomainEvent("inspection.completed", {
      inspectionId: inspection.id,
      extinguisherId: inspection.extinguisherId,
      result: inspection.result,
      recipientEmail: req.user.email
    });
  }

  return sendSuccess(res, {
    message: "Inspection updated successfully",
    data: { inspection }
  });
};

const deleteInspection = async (req, res) => {
  const inspection = await Inspection.findByPk(req.params.id);

  if (!inspection) {
    throw new AppError("Inspection not found", 404);
  }

  await inspection.destroy();

  return sendSuccess(res, {
    message: "Inspection deleted successfully",
    data: { id: req.params.id }
  });
};

const markOverdueInspections = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const [count] = await Inspection.update(
    { status: "OVERDUE" },
    {
      where: {
        status: "SCHEDULED",
        scheduledDate: { [Op.lt]: today }
      }
    }
  );

  return count;
};

export default {
  listInspections,
  scheduleInspection,
  getInspection,
  updateInspection,
  deleteInspection,
  markOverdueInspections
};
