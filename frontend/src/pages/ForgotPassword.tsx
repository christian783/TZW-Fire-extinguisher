import { Anchor, Button, Paper, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMailForward } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { ApiResponse, PasswordRecoveryResponse } from "../types";

type ForgotPasswordValues = {
  email: string;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const form = useForm<ForgotPasswordValues>({
    initialValues: {
      email: ""
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email")
    }
  });

  const requestRecoveryOtp = async (values: ForgotPasswordValues) => {
    const response = await api.post<ApiResponse<PasswordRecoveryResponse>>("/auth/forgot-password", values);
    const email = response.data.data.email || values.email;

    notifications.show({
      color: "blue",
      title: "Recovery code sent",
      message: "If the account exists, check the email inbox for the OTP."
    });

    navigate("/reset-password", { state: { email } });
  };

  return (
    <main className="auth-page">
      <Paper w="100%" maw={440} radius="md" p="xl" shadow="sm" withBorder>
        <Stack gap="lg">
          <div>
            <ThemeIcon size={44} radius="md" color="blue">
              <IconMailForward size={22} />
            </ThemeIcon>
            <Title order={1} mt="md" size="h2">
              Forgot password
            </Title>
            <Text c="dimmed" size="sm">
              Enter your account email to request a password recovery OTP.
            </Text>
          </div>

          <form onSubmit={form.onSubmit(requestRecoveryOtp)}>
            <Stack>
              <TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
              <Button type="submit" loading={form.submitting} fullWidth>
                Send recovery OTP
              </Button>
            </Stack>
          </form>

          <Stack gap="xs" align="center">
            <Anchor component={Link} to="/reset-password" size="sm">
              I already have a recovery OTP
            </Anchor>
            <Text ta="center" size="sm" c="dimmed">
              Remembered your password?{" "}
              <Anchor component={Link} to="/login">
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </Stack>
      </Paper>
    </main>
  );
};

export default ForgotPassword;
