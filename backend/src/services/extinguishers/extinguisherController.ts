import { Op } from "sequelize";

import { AppError } from "../../middleware/errorHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { publishDomainEvent } from "../../utils/domainEvents";
import paginate from "../../utils/paginate";
import FireExtinguisher from "./extinguisherModel";

const ensureExpiryAfterInstallation = (installationDate: string, expiryDate: string) => {
  if (new Date(expiryDate).getTime() <= new Date(installationDate).getTime()) {
    throw new AppError("expiryDate must be after installationDate", 422);
  }
};

const isExpiringSoon = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + 30);

  return expiry >= now && expiry <= cutoff;
};

const listExtinguishers = async (req, res) => {
  const { page = 1, limit = 10, status, type, location } = req.query;
  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  const result = await paginate(
    FireExtinguisher,
    {
      where,
      order: [["expiryDate", "ASC"], ["createdAt", "DESC"]]
    },
    page,
    limit
  );

  return sendSuccess(res, {
    message: "Fire extinguishers fetched successfully",
    data: { extinguishers: result.data },
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  });
};

const createExtinguisher = async (req, res) => {
  ensureExpiryAfterInstallation(req.body.installationDate, req.body.expiryDate);

  const existing = await FireExtinguisher.findOne({ where: { serialNumber: req.body.serialNumber } });
  if (existing) {
    throw new AppError("A fire extinguisher with this serial number already exists", 409);
  }

  const extinguisher = await FireExtinguisher.create({
    serialNumber: req.body.serialNumber,
    location: req.body.location,
    type: req.body.type,
    size: req.body.size,
    installationDate: req.body.installationDate,
    expiryDate: req.body.expiryDate,
    status: req.body.status || "ACTIVE",
    notes: req.body.notes || null
  });

  await publishDomainEvent("extinguisher.registered", {
    extinguisherId: (extinguisher as any).id,
    serialNumber: req.body.serialNumber,
    location: req.body.location,
    recipientEmail: req.user.email
  });

  if (isExpiringSoon(req.body.expiryDate)) {
    await publishDomainEvent("extinguisher.expiring", {
      extinguisherId: (extinguisher as any).id,
      serialNumber: req.body.serialNumber,
      expiryDate: req.body.expiryDate,
      recipientEmail: req.user.email
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: "Fire extinguisher registered successfully",
    data: { extinguisher }
  });
};

const getExtinguisher = async (req, res) => {
  const extinguisher = await FireExtinguisher.findByPk(req.params.id);

  if (!extinguisher) {
    throw new AppError("Fire extinguisher not found", 404);
  }

  return sendSuccess(res, {
    message: "Fire extinguisher fetched successfully",
    data: { extinguisher }
  });
};

const updateExtinguisher = async (req, res) => {
  const extinguisher: any = await FireExtinguisher.findByPk(req.params.id);

  if (!extinguisher) {
    throw new AppError("Fire extinguisher not found", 404);
  }

  const nextInstallationDate = req.body.installationDate || extinguisher.installationDate;
  const nextExpiryDate = req.body.expiryDate || extinguisher.expiryDate;
  ensureExpiryAfterInstallation(nextInstallationDate, nextExpiryDate);

  ["serialNumber", "location", "type", "size", "installationDate", "expiryDate", "status", "notes"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      extinguisher[field] = req.body[field];
    }
  });

  await extinguisher.save();

  await publishDomainEvent("extinguisher.status_changed", {
    extinguisherId: extinguisher.id,
    serialNumber: extinguisher.serialNumber,
    status: extinguisher.status,
    recipientEmail: req.user.email
  });

  if (isExpiringSoon(extinguisher.expiryDate)) {
    await publishDomainEvent("extinguisher.expiring", {
      extinguisherId: extinguisher.id,
      serialNumber: extinguisher.serialNumber,
      expiryDate: extinguisher.expiryDate,
      recipientEmail: req.user.email
    });
  }

  return sendSuccess(res, {
    message: "Fire extinguisher updated successfully",
    data: { extinguisher }
  });
};

const deleteExtinguisher = async (req, res) => {
  const extinguisher = await FireExtinguisher.findByPk(req.params.id);

  if (!extinguisher) {
    throw new AppError("Fire extinguisher not found", 404);
  }

  await extinguisher.destroy();

  return sendSuccess(res, {
    message: "Fire extinguisher deleted successfully",
    data: { id: req.params.id }
  });
};

export default {
  listExtinguishers,
  createExtinguisher,
  getExtinguisher,
  updateExtinguisher,
  deleteExtinguisher
};
