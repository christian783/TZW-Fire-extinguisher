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
    case "auth.otp_requested":
      return "Your TZW Fire Safety verification code";
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

const otpEmailBody = (payload: Record<string, unknown>) => {
  const purpose = String(payload.purpose || "signup");
  const action =
    purpose === "password-recovery"
      ? "reset your password"
      : purpose === "signup-resend"
        ? "complete your email verification"
        : "activate your account";

  return [
    `Hello ${String(payload.firstName || "there")},`,
    "",
    `Use this one-time password to ${action}:`,
    "",
    String(payload.otpCode || ""),
    "",
    `This code expires at ${new Date(String(payload.expiresAt)).toLocaleString()}.`,
    "",
    "If you did not request this code, you can ignore this email.",
    "",
    "TZW Fire Safety"
  ].join("\n");
};

const eventBody = (type: string, payload: Record<string, unknown>) => {
  if (type === "auth.otp_requested") {
    return otpEmailBody(payload);
  }

  const lines = [
    "TZW Fire Safety notification",
    "",
    `Event: ${type}`,
    "",
    ...Object.entries(payload)
      .filter(([key]) => key !== "recipientEmail")
      .filter(([key]) => key !== "otpCode")
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
