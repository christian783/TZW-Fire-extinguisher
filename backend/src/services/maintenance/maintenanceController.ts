import { AppError } from "../../middleware/errorHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { publishDomainEvent } from "../../utils/domainEvents";
import paginate from "../../utils/paginate";
import { fetchServiceJson, getAuthorizationHeader, sendServiceJson } from "../../utils/serviceClient";
import MaintenanceLog from "./maintenanceModel";

const extinguisherServiceUrl = () => process.env.EXTINGUISHER_SERVICE_URL || "http://localhost:5103";

const listMaintenanceLogs = async (req, res) => {
  const { page = 1, limit = 10, extinguisherId, inspectorId } = req.query;
  const where: Record<string, unknown> = {};

  if (extinguisherId) {
    where.extinguisherId = extinguisherId;
  }

  if (inspectorId) {
    where.inspectorId = inspectorId;
  }

  const result = await paginate(
    MaintenanceLog,
    {
      where,
      order: [["maintenanceDate", "DESC"], ["createdAt", "DESC"]]
    },
    page,
    limit
  );

  return sendSuccess(res, {
    message: "Maintenance logs fetched successfully",
    data: { maintenanceLogs: result.data },
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  });
};

const createMaintenanceLog = async (req, res) => {
  await fetchServiceJson(new URL(`/extinguishers/${req.body.extinguisherId}`, extinguisherServiceUrl()), getAuthorizationHeader(req));

  const maintenanceLog = await MaintenanceLog.create({
    extinguisherId: req.body.extinguisherId,
    inspectorId: req.user.id,
    actionTaken: req.body.actionTaken,
    maintenanceDate: req.body.maintenanceDate,
    issuesIdentified: req.body.issuesIdentified || null,
    recommendations: req.body.recommendations || null
  });

  await sendServiceJson(
    new URL(`/extinguishers/${req.body.extinguisherId}`, extinguisherServiceUrl()),
    "PATCH",
    { status: req.body.nextStatus || "ACTIVE" },
    getAuthorizationHeader(req)
  );

  await publishDomainEvent("maintenance.logged", {
    maintenanceLogId: (maintenanceLog as any).id,
    extinguisherId: req.body.extinguisherId,
    actionTaken: req.body.actionTaken,
    recipientEmail: req.user.email
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Maintenance activity logged successfully",
    data: { maintenanceLog }
  });
};

const getMaintenanceLog = async (req, res) => {
  const maintenanceLog = await MaintenanceLog.findByPk(req.params.id);

  if (!maintenanceLog) {
    throw new AppError("Maintenance log not found", 404);
  }

  return sendSuccess(res, {
    message: "Maintenance log fetched successfully",
    data: { maintenanceLog }
  });
};

const updateMaintenanceLog = async (req, res) => {
  const maintenanceLog: any = await MaintenanceLog.findByPk(req.params.id);

  if (!maintenanceLog) {
    throw new AppError("Maintenance log not found", 404);
  }

  ["actionTaken", "maintenanceDate", "issuesIdentified", "recommendations"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      maintenanceLog[field] = req.body[field];
    }
  });

  await maintenanceLog.save();

  return sendSuccess(res, {
    message: "Maintenance log updated successfully",
    data: { maintenanceLog }
  });
};

const deleteMaintenanceLog = async (req, res) => {
  const maintenanceLog = await MaintenanceLog.findByPk(req.params.id);

  if (!maintenanceLog) {
    throw new AppError("Maintenance log not found", 404);
  }

  await maintenanceLog.destroy();

  return sendSuccess(res, {
    message: "Maintenance log deleted successfully",
    data: { id: req.params.id }
  });
};

export default {
  listMaintenanceLogs,
  createMaintenanceLog,
  getMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog
};
