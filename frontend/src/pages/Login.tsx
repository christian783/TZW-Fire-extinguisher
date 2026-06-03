import { Anchor, Button, Paper, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconLogin2 } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, AuthResponse } from "../types";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/dashboard";

  const form = useForm({
    initialValues: {
      email: "",
      password: ""
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
      password: (value) => (value ? null : "Password is required")
    }
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", values);
      login(response.data.data.token);
      notifications.show({ color: "green", title: "Welcome back", message: "You are signed in." });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = (error as AxiosError).response?.status;

      if (status === 403) {
        navigate("/verify-otp", { state: { email: values.email } });
      }
    }
  };

  return (
    <main className="auth-page">
      <Paper w="100%" maw={420} radius="md" p="xl" shadow="sm" withBorder>
        <Stack gap="lg">
          <div>
            <ThemeIcon size={44} radius="md">
              <IconLogin2 size={22} />
            </ThemeIcon>
            <Title order={1} mt="md" size="h2">
              Sign in
            </Title>
            <Text c="dimmed" size="sm">
              Sign in with a verified account.
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
              <PasswordInput label="Password" autoComplete="current-password" required {...form.getInputProps("password")} />
              <Anchor component={Link} to="/forgot-password" size="sm" ta="right">
                Forgot password?
              </Anchor>
              <Button type="submit" loading={form.submitting} fullWidth>
                Sign in
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm" c="dimmed">
            Need an account?{" "}
            <Anchor component={Link} to="/register">
              Register
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </main>
  );
};

export default Login;
