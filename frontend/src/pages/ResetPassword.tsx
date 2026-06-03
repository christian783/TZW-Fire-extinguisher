import { Anchor, Button, Group, Paper, PasswordInput, PinInput, Progress, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLockCheck, IconX } from "@tabler/icons-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/axios";
import { ApiResponse, PasswordRecoveryResponse, ResetPasswordResponse } from "../types";
import { getPasswordScore, getPasswordStrength, isPasswordValid, passwordRequirements, passwordValidationMessage } from "../utils/passwordRules";

type ResetPasswordValues = {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as { email?: string } | null;
  const form = useForm<ResetPasswordValues>({
    initialValues: {
      email: state?.email || searchParams.get("email") || "",
      otp: "",
      password: "",
      confirmPassword: ""
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
      otp: (value) => (/^\d{6}$/.test(value) ? null : "OTP must be 6 digits"),
      password: (value) => (isPasswordValid(value) ? null : passwordValidationMessage),
      confirmPassword: (value, values) => (value === values.password ? null : "Passwords do not match")
    }
  });

  const passwordScore = getPasswordScore(form.values.password);
  const passwordStrength = getPasswordStrength(passwordScore);

  const resetPassword = async (values: ResetPasswordValues) => {
    await api.post<ApiResponse<ResetPasswordResponse>>("/auth/reset-password", {
      email: values.email,
      otp: values.otp,
      password: values.password
    });

    notifications.show({
      color: "green",
      title: "Password reset",
      message: "Sign in with your new password."
    });

    navigate("/login", { replace: true });
  };

  const requestNewOtp = async () => {
    const emailError = form.validateField("email");
    if (emailError.hasError) {
      return;
    }

    await api.post<ApiResponse<PasswordRecoveryResponse>>("/auth/forgot-password", { email: form.values.email });
    notifications.show({
      color: "blue",
      title: "Recovery code sent",
      message: "If the account exists, check the email inbox for the OTP."
    });
  };

  return (
    <main className="auth-page">
      <Paper w="100%" maw={520} radius="md" p="xl" shadow="sm" withBorder>
        <Stack gap="lg">
          <div>
            <ThemeIcon size={44} radius="md" color="teal">
              <IconLockCheck size={22} />
            </ThemeIcon>
            <Title order={1} mt="md" size="h2">
              Reset password
            </Title>
            <Text c="dimmed" size="sm">
              Use the 6-digit recovery OTP and choose a new password.
            </Text>
          </div>

          <form onSubmit={form.onSubmit(resetPassword)}>
            <Stack>
              <TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
              <Stack gap={6}>
                <Text size="sm" fw={500}>
                  Recovery OTP
                </Text>
                <PinInput length={6} type="number" oneTimeCode value={form.values.otp} onChange={(value) => form.setFieldValue("otp", value)} />
                {form.errors.otp ? (
                  <Text c="red" size="xs">
                    {form.errors.otp}
                  </Text>
                ) : null}
              </Stack>
              <PasswordInput label="New password" autoComplete="new-password" required {...form.getInputProps("password")} />
              <PasswordInput label="Confirm new password" autoComplete="new-password" required {...form.getInputProps("confirmPassword")} />

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={700}>
                    Password strength
                  </Text>
                  <Text size="sm" c={passwordStrength.color} fw={700}>
                    {passwordStrength.label}
                  </Text>
                </Group>
                <Progress value={passwordScore} color={passwordStrength.color} size="sm" radius="xl" />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  {passwordRequirements.map((requirement) => {
                    const passed = requirement.test(form.values.password);
                    const Icon = passed ? IconCheck : IconX;

                    return (
                      <Group key={requirement.label} gap={6} wrap="nowrap">
                        <ThemeIcon size={18} radius="xl" variant="light" color={passed ? "teal" : "red"}>
                          <Icon size={12} />
                        </ThemeIcon>
                        <Text size="xs" c={passed ? "teal" : "dimmed"}>
                          {requirement.label}
                        </Text>
                      </Group>
                    );
                  })}
                </SimpleGrid>
              </Stack>

              <Button type="submit" loading={form.submitting} fullWidth>
                Reset password
              </Button>
            </Stack>
          </form>

          <Group justify="space-between">
            <Button variant="subtle" onClick={requestNewOtp}>
              Send new OTP
            </Button>
            <Anchor component={Link} to="/login" size="sm">
              Back to sign in
            </Anchor>
          </Group>
        </Stack>
      </Paper>
    </main>
  );
};

export default ResetPassword;
