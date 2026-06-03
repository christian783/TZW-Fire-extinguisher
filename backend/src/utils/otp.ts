import bcrypt from "bcryptjs";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

export const generateOtpCode = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return String(crypto.randomInt(min, max));
};

export const hashOtpCode = (code: string) => bcrypt.hash(code, 10);

export const compareOtpCode = (candidateCode: string, hashedCode: string) => {
  return bcrypt.compare(candidateCode, hashedCode);
};

export const createOtpExpiry = () => {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
};

export const isOtpExpired = (expiresAt?: Date | string | null) => {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
};
