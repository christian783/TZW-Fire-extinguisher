import { sendEmail } from "./emailService";

export const buildInspectionScheduledNotification = (inspection, extinguisher) => ({
  type: "INSPECTION_SCHEDULED",
  title: "Inspection scheduled",
  message: `Inspection scheduled for extinguisher ${extinguisher.serialNumber} at ${extinguisher.location}.`,
  inspectionId: inspection.id,
  extinguisherId: extinguisher.id,
  scheduledDate: inspection.scheduledDate,
  scheduledTime: inspection.scheduledTime
});

const eventSubject = (type: string) => {
  switch (type) {
    case "inspection.scheduled":
      return "Inspection scheduled";
    case "inspection.completed":
      return "Inspection completed";
    case "maintenance.logged":
      return "Maintenance activity logged";
    case "user.registered":
      return "User registered";
    case "extinguisher.registered":
      return "Fire extinguisher registered";
    case "extinguisher.status_changed":
      return "Fire extinguisher status changed";
    case "extinguisher.expiring":
      return "Fire extinguisher expiring soon";
    default:
      return "TZW Fire Safety notification";
  }
};

const eventBody = (type: string, payload: Record<string, unknown>) => {
  const lines = [
    "TZW Fire Safety notification",
    "",
    `Event: ${type}`,
    "",
    ...Object.entries(payload)
      .filter(([key]) => key !== "recipientEmail")
      .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
  ];

  return lines.join("\n");
};

export const sendDomainEventEmail = async (type: string, payload: Record<string, unknown>) => {
  const recipientEmail = String(payload.recipientEmail || process.env.NOTIFICATION_DEFAULT_RECIPIENT || process.env.SMTP_USER || "");

  if (!recipientEmail) {
    throw new Error("No notification recipient configured");
  }

  await sendEmail({
    to: recipientEmail,
    subject: eventSubject(type),
    text: eventBody(type, payload)
  });

  return {
    type,
    recipientEmail,
    channel: "email",
    sentAt: new Date().toISOString()
  };
};

export const listOperationalNotifications = async () => [];
