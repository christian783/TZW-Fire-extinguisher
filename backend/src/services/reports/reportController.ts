import { AppError } from "../../middleware/errorHandler";
import { serviceRegistry } from "../../platform/serviceRegistry";
import { sendSuccess } from "../../utils/apiResponse";
import { fetchServiceJson, getAuthorizationHeader } from "../../utils/serviceClient";

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const startOfDay = () => new Date(new Date().setHours(0, 0, 0, 0));

const startOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const startOfYear = () => {
  const date = new Date();
  return new Date(date.getFullYear(), 0, 1);
};

const countBy = (items: any[], key: string) => {
  return items.reduce((acc, item) => {
    const value = item[key] || "UNKNOWN";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

const isOnOrAfter = (value: string, date: Date) => new Date(value).getTime() >= date.getTime();

const fetchExtinguishers = async (authorization: string) => {
  const response = await fetchServiceJson(new URL("/extinguishers?limit=100", serviceRegistry.extinguishers), authorization);
  return response.data?.extinguishers || [];
};

const fetchInspections = async (authorization: string) => {
  const response = await fetchServiceJson(new URL("/inspections?limit=100", serviceRegistry.inspectionMaintenance), authorization);
  return response.data?.inspections || [];
};

const fetchMaintenanceLogs = async (authorization: string) => {
  const response = await fetchServiceJson(new URL("/maintenance?limit=100", serviceRegistry.inspectionMaintenance), authorization);
  return response.data?.maintenanceLogs || [];
};

const getInventoryReportData = async (authorization: string) => {
  const extinguishers = await fetchExtinguishers(authorization);

  return {
    totalExtinguishers: extinguishers.length,
    dailyInventorySummary: extinguishers.filter((item) => item.createdAt && isOnOrAfter(item.createdAt, startOfDay())).length,
    monthlyInventorySummary: extinguishers.filter((item) => item.createdAt && isOnOrAfter(item.createdAt, startOfMonth())).length,
    yearlyInventorySummary: extinguishers.filter((item) => item.createdAt && isOnOrAfter(item.createdAt, startOfYear())).length,
    byStatus: countBy(extinguishers, "status"),
    byType: countBy(extinguishers, "type")
  };
};

const getInspectionReportData = async (authorization: string) => {
  const inspections = await fetchInspections(authorization);
  const currentDate = today();

  return {
    pendingInspections: inspections.filter((inspection) => inspection.status === "SCHEDULED").length,
    completedInspections: inspections.filter((inspection) => inspection.status === "COMPLETED").length,
    overdueInspections: inspections.filter((inspection) => inspection.status === "OVERDUE" || (inspection.status === "SCHEDULED" && inspection.scheduledDate < currentDate)).length
  };
};

const getComplianceReportData = async (authorization: string) => {
  const extinguishers = await fetchExtinguishers(authorization);
  const currentDate = today();
  const upcomingCutoff = addDays(30);
  const expiredExtinguishers = extinguishers.filter((item) => item.status === "EXPIRED" || item.expiryDate < currentDate).length;
  const upcomingExpirations = extinguishers
    .filter((item) => !["EXPIRED", "RETIRED"].includes(item.status) && item.expiryDate >= currentDate && item.expiryDate <= upcomingCutoff)
    .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)))
    .slice(0, 20);
  const compliant = extinguishers.filter((item) => item.status === "ACTIVE" && item.expiryDate >= currentDate).length;

  return {
    expiredExtinguishers,
    upcomingExpirations,
    complianceStatus: {
      compliant,
      total: extinguishers.length,
      percentage: extinguishers.length > 0 ? Math.round((compliant / extinguishers.length) * 100) : 100
    }
  };
};

const getMaintenanceReportData = async (authorization: string) => {
  const maintenanceLogs = await fetchMaintenanceLogs(authorization);

  return {
    maintenanceHistory: maintenanceLogs.length,
    maintenanceFrequency: maintenanceLogs.length,
    recentMaintenanceActivities: maintenanceLogs.slice(0, 20)
  };
};

const getDashboardData = async (authorization: string) => {
  const [inventory, inspections, compliance, maintenance] = await Promise.all([
    getInventoryReportData(authorization),
    getInspectionReportData(authorization),
    getComplianceReportData(authorization),
    getMaintenanceReportData(authorization)
  ]);

  return {
    inventory,
    inspections,
    compliance,
    maintenance
  };
};

const getReportPayload = async (reportType: string, authorization: string) => {
  switch (reportType) {
    case "inventory":
      return getInventoryReportData(authorization);
    case "inspections":
      return getInspectionReportData(authorization);
    case "compliance":
      return getComplianceReportData(authorization);
    case "maintenance":
      return getMaintenanceReportData(authorization);
    default:
      throw new AppError("reportType must be inventory, inspections, compliance, or maintenance", 422);
  }
};

const flattenForExport = (value: unknown, prefix = ""): Array<[string, string]> => {
  if (Array.isArray(value)) {
    return [[prefix || "items", JSON.stringify(value)]];
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => flattenForExport(nested, prefix ? `${prefix}.${key}` : key));
  }

  return [[prefix, String(value ?? "")]];
};

const toCsv = (title: string, payload: unknown) => {
  const lines = [["metric", "value"], ...flattenForExport(payload)];
  return [`# ${title}`, ...lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
};

const escapePdfText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createSimplePdf = (title: string, payload: unknown) => {
  const lines = [title, ...flattenForExport(payload).slice(0, 32).map(([metric, value]) => `${metric}: ${value}`)];
  const content = ["BT", "/F1 12 Tf", "50 780 Td", ...lines.flatMap((line, index) => [`(${escapePdfText(line.slice(0, 95))}) Tj`, index === lines.length - 1 ? "" : "0 -18 Td"]), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const dashboard = async (req, res) => {
  const dashboardData = await getDashboardData(getAuthorizationHeader(req));

  return sendSuccess(res, {
    message: "Dashboard report fetched successfully",
    data: dashboardData
  });
};

const inventory = async (req, res) => {
  const report = await getInventoryReportData(getAuthorizationHeader(req));

  return sendSuccess(res, {
    message: "Inventory report fetched successfully",
    data: { report }
  });
};

const inspections = async (req, res) => {
  const report = await getInspectionReportData(getAuthorizationHeader(req));

  return sendSuccess(res, {
    message: "Inspection report fetched successfully",
    data: { report }
  });
};

const compliance = async (req, res) => {
  const report = await getComplianceReportData(getAuthorizationHeader(req));

  return sendSuccess(res, {
    message: "Compliance report fetched successfully",
    data: { report }
  });
};

const maintenance = async (req, res) => {
  const report = await getMaintenanceReportData(getAuthorizationHeader(req));

  return sendSuccess(res, {
    message: "Maintenance report fetched successfully",
    data: { report }
  });
};

const exportReport = async (req, res) => {
  const reportType = req.params.reportType;
  const format = String(req.query.format || "csv").toLowerCase();
  const payload = await getReportPayload(reportType, getAuthorizationHeader(req));
  const fileBase = `${reportType}-report-${today()}`;

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    return res.status(200).send(toCsv(`${reportType} report`, payload));
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.pdf"`);
    return res.status(200).send(createSimplePdf(`${reportType} report`, payload));
  }

  throw new AppError("format must be csv or pdf", 422);
};

export default {
  dashboard,
  inventory,
  inspections,
  compliance,
  maintenance,
  exportReport
};
