export type PasswordRequirement = {
  label: string;
  test: (value: string) => boolean;
  required?: boolean;
};

export const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (value) => value.length >= 8, required: true },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value), required: true },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value), required: true },
  { label: "One number", test: (value) => /[0-9]/.test(value), required: true },
  { label: "Not just letters or numbers", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

export const passwordValidationMessage = "Password must be 8+ characters with uppercase, lowercase, and number";

export const isPasswordValid = (password: string) => passwordRequirements.filter((requirement) => requirement.required).every((requirement) => requirement.test(password));

export const getPasswordScore = (password: string) => {
  if (!password) {
    return 0;
  }

  return Math.round((passwordRequirements.filter((requirement) => requirement.test(password)).length / passwordRequirements.length) * 100);
};

export const getPasswordStrength = (score: number) => {
  if (score < 40) {
    return { color: "red", label: "Weak" };
  }

  if (score < 80) {
    return { color: "yellow", label: "Good" };
  }

  return { color: "teal", label: "Strong" };
};
