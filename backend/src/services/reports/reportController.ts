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

const queryString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

type ReportExportContext = {
  generatedAt: Date;
  fromDate?: string;
  reportType: string;
  toDate?: string;
};

type ReportSection = {
  headers?: string[];
  rows: Array<Array<string | number>>;
  title: string;
};

const humanize = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const reportTitle = (reportType: string) => `${humanize(reportType)} Report`;

const formatDateTime = (date: Date) => `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;

const formatPeriod = (context: ReportExportContext) => {
  if (context.fromDate && context.toDate) {
    return `${context.fromDate} to ${context.toDate}`;
  }

  if (context.fromDate) {
    return `From ${context.fromDate}`;
  }

  if (context.toDate) {
    return `Until ${context.toDate}`;
  }

  return "All available records";
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
};

const metricRows = (items: Record<string, unknown>) => Object.entries(items).map(([key, value]) => [humanize(key), formatValue(value)]);

const breakdownRows = (items: Record<string, number> | undefined) => {
  const entries = Object.entries(items || {});
  return entries.length > 0 ? entries.map(([key, value]) => [humanize(key), value]) : [["No records", 0]];
};

const extinguisherLabel = (item: any) => item?.name || item?.serialNumber || item?.id || "Fire extinguisher";

const buildReportSections = (reportType: string, payload: any, target: "csv" | "pdf" = "csv"): ReportSection[] => {
  switch (reportType) {
    case "inventory":
      return [
        {
          title: "Executive Summary",
          headers: ["Metric", "Value"],
          rows: metricRows({
            totalExtinguishers: payload.totalExtinguishers,
            addedToday: payload.dailyInventorySummary,
            addedThisMonth: payload.monthlyInventorySummary,
            addedThisYear: payload.yearlyInventorySummary
          })
        },
        {
          title: "Status Breakdown",
          headers: ["Status", "Count"],
          rows: breakdownRows(payload.byStatus)
        },
        {
          title: "Type Breakdown",
          headers: ["Type", "Count"],
          rows: breakdownRows(payload.byType)
        }
      ];
    case "inspections":
      return [
        {
          title: "Inspection Performance",
          headers: ["Metric", "Value"],
          rows: metricRows({
            pendingInspections: payload.pendingInspections,
            completedInspections: payload.completedInspections,
            overdueInspections: payload.overdueInspections
          })
        }
      ];
    case "compliance":
      return [
        {
          title: "Compliance Snapshot",
          headers: ["Metric", "Value"],
          rows: metricRows({
            expiredExtinguishers: payload.expiredExtinguishers,
            compliantExtinguishers: payload.complianceStatus?.compliant,
            totalExtinguishers: payload.complianceStatus?.total,
            compliancePercentage: `${payload.complianceStatus?.percentage ?? 0}%`
          })
        },
        {
          title: "Upcoming Expirations",
          headers: target === "pdf" ? ["Extinguisher", "Location", "Status", "Expiry"] : ["Extinguisher", "Serial Number", "Location", "Type", "Status", "Expiry Date"],
          rows: (payload.upcomingExpirations || []).map((item) =>
            target === "pdf"
              ? [extinguisherLabel(item), formatValue(item.location), formatValue(item.status), formatValue(item.expiryDate)]
              : [extinguisherLabel(item), formatValue(item.serialNumber), formatValue(item.location), formatValue(item.type), formatValue(item.status), formatValue(item.expiryDate)]
          )
        }
      ];
    case "maintenance":
      return [
        {
          title: "Maintenance Summary",
          headers: ["Metric", "Value"],
          rows: metricRows({
            maintenanceHistory: payload.maintenanceHistory,
            maintenanceFrequency: payload.maintenanceFrequency
          })
        },
        {
          title: "Recent Maintenance Activity",
          headers:
            target === "pdf"
              ? ["Date", "Extinguisher", "Action", "Inspector"]
              : ["Date", "Extinguisher", "Location", "Inspector", "Action Taken", "Issues", "Recommendations"],
          rows: (payload.recentMaintenanceActivities || []).map((item) =>
            target === "pdf"
              ? [
                  formatValue(item.maintenanceDate),
                  extinguisherLabel(item.extinguisher || item),
                  formatValue(item.actionTaken),
                  formatValue(item.inspector ? `${item.inspector.firstName || ""} ${item.inspector.lastName || ""}`.trim() : "")
                ]
              : [
                  formatValue(item.maintenanceDate),
                  extinguisherLabel(item.extinguisher || item),
                  formatValue(item.extinguisher?.location),
                  formatValue(item.inspector ? `${item.inspector.firstName || ""} ${item.inspector.lastName || ""}`.trim() : ""),
                  formatValue(item.actionTaken),
                  formatValue(item.issuesIdentified),
                  formatValue(item.recommendations)
                ]
          )
        }
      ];
    default:
      return [
        {
          title: "Report Data",
          headers: ["Metric", "Value"],
          rows: Object.entries(payload || {}).map(([key, value]) => [humanize(key), formatValue(typeof value === "object" ? JSON.stringify(value) : value)])
        }
      ];
  }
};

const csvCell = (value: unknown) => `"${formatValue(value).replace(/"/g, '""')}"`;

const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

const toCsv = (payload: unknown, context: ReportExportContext) => {
  const title = reportTitle(context.reportType);
  const sections = buildReportSections(context.reportType, payload);
  const rows: string[] = [
    csvRow(["Report", title]),
    csvRow(["Generated At", formatDateTime(context.generatedAt)]),
    csvRow(["Reporting Period", formatPeriod(context)]),
    csvRow(["Prepared By", "Fire Safety Reporting Service"]),
    ""
  ];

  sections.forEach((section) => {
    rows.push(csvRow([section.title]));
    if (section.headers) {
      rows.push(csvRow(section.headers));
    }
    const sectionRows = section.rows.length > 0 ? section.rows : [["No records available"]];
    sectionRows.forEach((row) => rows.push(csvRow(row)));
    rows.push("");
  });

  return rows.join("\n");
};

const cleanPdfText = (value: unknown, maxLength = 110) => {
  return formatValue(value)
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

const escapePdfText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createReportPdf = (payload: unknown, context: ReportExportContext) => {
  const title = reportTitle(context.reportType);
  const sections = buildReportSections(context.reportType, payload, "pdf");
  const content: string[] = [];
  const colors = {
    accent: "0.09 0.45 0.75",
    border: "0.82 0.87 0.92",
    dark: "0.04 0.14 0.26",
    muted: "0.37 0.43 0.50",
    row: "0.95 0.97 0.99",
    surface: "0.98 0.99 1.00",
    text: "0.07 0.09 0.13",
    white: "1 1 1"
  };

  const rect = (x: number, y: number, width: number, height: number, color: string) => {
    content.push("q", `${color} rg`, `${x} ${y} ${width} ${height} re f`, "Q");
  };

  const strokeRect = (x: number, y: number, width: number, height: number, color: string) => {
    content.push("q", `${color} RG`, "0.7 w", `${x} ${y} ${width} ${height} re S`, "Q");
  };

  const text = (value: unknown, x: number, y: number, size: number, font = "F1", color = colors.text, maxLength = 110) => {
    content.push("BT", `${color} rg`, `/${font} ${size} Tf`, `${x} ${y} Td`, `(${escapePdfText(cleanPdfText(value, maxLength))}) Tj`, "ET");
  };

  rect(0, 0, 612, 792, colors.surface);
  rect(0, 718, 612, 74, colors.dark);
  rect(0, 718, 612, 5, colors.accent);
  text(title, 36, 758, 23, "F2", colors.white, 72);
  text(`Generated ${formatDateTime(context.generatedAt)} | ${formatPeriod(context)}`, 36, 738, 9, "F1", "0.86 0.91 0.96", 100);
  text("Fire Safety Reporting Service", 414, 758, 10, "F2", "0.86 0.91 0.96", 40);

  const summary = sections[0]?.rows || [];
  const cardGap = 12;
  const cardWidth = (540 - cardGap * 3) / 4;
  summary.slice(0, 4).forEach(([label, value], index) => {
    const x = 36 + index * (cardWidth + cardGap);
    rect(x, 634, cardWidth, 58, colors.white);
    rect(x, 634, 4, 58, colors.accent);
    strokeRect(x, 634, cardWidth, 58, colors.border);
    text(value, x + 14, 668, 18, "F2", colors.dark, 16);
    text(label, x + 14, 649, 8.5, "F1", colors.muted, 28);
  });

  let y = 592;
  sections.slice(summary.length > 0 ? 1 : 0).forEach((section) => {
    if (y < 135) {
      return;
    }

    text(section.title, 36, y, 14, "F2", colors.dark, 58);
    y -= 22;

    if (section.headers) {
      const tableWidth = 540;
      const columnWidth = tableWidth / section.headers.length;
      rect(36, y - 3, tableWidth, 20, colors.dark);
      section.headers.forEach((header, index) => {
        text(header, 44 + index * columnWidth, y + 3, 8, "F2", colors.white, Math.max(10, Math.floor(columnWidth / 5)));
      });
      y -= 20;

      const availableRows = Math.min(section.rows.length, Math.floor((y - 92) / 22));
      section.rows.slice(0, availableRows).forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          rect(36, y - 3, tableWidth, 20, colors.row);
        } else {
          rect(36, y - 3, tableWidth, 20, colors.white);
        }
        strokeRect(36, y - 3, tableWidth, 20, colors.border);
        row.forEach((cell, index) => {
          text(cell, 44 + index * columnWidth, y + 3, 7.5, "F1", colors.text, Math.max(10, Math.floor(columnWidth / 5)));
        });
        y -= 22;
      });

      if (section.rows.length === 0) {
        rect(36, y - 3, tableWidth, 20, colors.white);
        strokeRect(36, y - 3, tableWidth, 20, colors.border);
        text("No records available", 44, y + 3, 8, "F1", colors.muted, 50);
        y -= 22;
      } else if (availableRows < section.rows.length) {
        text(`Showing ${availableRows} of ${section.rows.length} rows. Export CSV for the complete detail set.`, 40, y, 8, "F1", colors.muted, 90);
        y -= 18;
      }
    }

    y -= 18;
  });

  rect(36, 54, 540, 1, colors.border);
  text("Confidential operational report", 36, 36, 8, "F1", colors.muted, 40);
  text("Page 1", 536, 36, 8, "F1", colors.muted, 12);

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
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
  const context: ReportExportContext = {
    fromDate: queryString(req.query.fromDate),
    generatedAt: new Date(),
    reportType,
    toDate: queryString(req.query.toDate)
  };
  const fileBase = `${reportType}-report-${today()}`;

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    return res.status(200).send(toCsv(payload, context));
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.pdf"`);
    return res.status(200).send(createReportPdf(payload, context));
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
