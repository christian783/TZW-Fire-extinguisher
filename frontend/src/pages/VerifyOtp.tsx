import { Anchor, Button, Group, Paper, PinInput, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMailCheck } from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, AuthResponse, OtpResponse } from "../types";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const state = location.state as { email?: string } | null;

  const form = useForm({
    initialValues: {
      email: state?.email || "",
      otp: ""
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
      otp: (value) => (/^\d{6}$/.test(value) ? null : "OTP must be 6 digits")
    }
  });

  const verifyOtp = async (values: typeof form.values) => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/verify-otp", values);
    login(response.data.data.token);
    notifications.show({ color: "green", title: "Email verified", message: "Your account is active." });
    navigate("/dashboard", { replace: true });
  };

  const resendOtp = async () => {
    const emailError = form.validateField("email");
    if (emailError.hasError) {
      return;
    }

    const response = await api.post<ApiResponse<OtpResponse>>("/auth/resend-otp", { email: form.values.email });
    const otpData = response.data.data;
    notifications.show({
      color: "blue",
      title: "OTP sent",
      message: `Check ${otpData.email} for the new OTP.`
    });
  };

  return (
    <main className="auth-page">
      <Paper w="100%" maw={440} radius="md" p="xl" shadow="sm" withBorder>
        <Stack gap="lg">
          <div>
            <ThemeIcon size={44} radius="md" color="teal">
              <IconMailCheck size={22} />
            </ThemeIcon>
            <Title order={1} mt="md" size="h2">
              Verify OTP
            </Title>
            <Text c="dimmed" size="sm">
              Enter the 6-digit code generated during signup.
            </Text>
          </div>

          <form onSubmit={form.onSubmit(verifyOtp)}>
            <Stack>
              <TextInput label="Email" type="email" required {...form.getInputProps("email")} />
              <Stack gap={6}>
                <Text size="sm" fw={500}>
                  OTP
                </Text>
                <PinInput length={6} type="number" oneTimeCode value={form.values.otp} onChange={(value) => form.setFieldValue("otp", value)} />
                {form.errors.otp ? (
                  <Text c="red" size="xs">
                    {form.errors.otp}
                  </Text>
                ) : null}
              </Stack>
              <Button type="submit" loading={form.submitting} fullWidth>
                Verify and continue
              </Button>
            </Stack>
          </form>

          <Group justify="space-between">
            <Button variant="subtle" onClick={resendOtp}>
              Resend OTP
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

export default VerifyOtp;
