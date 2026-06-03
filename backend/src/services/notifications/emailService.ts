import nodemailer from "nodemailer";
import logger from "../../utils/logger";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS || 10000);
const isGmailSmtp = () => SMTP_HOST === "smtp.gmail.com";

const smtpPassword = (password: string) => {
  return isGmailSmtp() ? password.replace(/\s+/g, "") : password;
};

const createTransporter = () => {
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!username || !password) {
    throw new Error("SMTP_USER and SMTP_PASS are required for email notifications");
  }

  return nodemailer.createTransport({
    service: isGmailSmtp() ? "gmail" : undefined,
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: username,
      pass: smtpPassword(password)
    }
  });
};

export const sendEmail = async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
  const username = process.env.SMTP_USER;
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"TZW Fire Safety" <${username}>`,
    to,
    subject,
    text
  });

  logger.info("[notification-service] Email sent", {
    to,
    subject,
    messageId: info.messageId
  });
};

export const verifyEmailTransport = async () => {
  const transporter = createTransporter();
  await transporter.verify();

  logger.info("[notification-service] Gmail SMTP transport verified", {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: process.env.SMTP_USER
  });
};
