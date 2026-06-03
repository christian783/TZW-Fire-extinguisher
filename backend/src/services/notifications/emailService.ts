import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

const createTransporter = () => {
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!username || !password) {
    throw new Error("SMTP_USER and SMTP_PASS are required for email notifications");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: username,
      pass: password
    }
  });
};

export const sendEmail = async ({ to, subject, text }: { to: string; subject: string; text: string }) => {
  const username = process.env.SMTP_USER;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"TZW Fire Safety" <${username}>`,
    to,
    subject,
    text
  });
};
