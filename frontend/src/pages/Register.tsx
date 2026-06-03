import { Anchor, Button, Group, Paper, PasswordInput, Progress, Select, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconUserPlus, IconX } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { ApiResponse, OtpResponse, Role } from "../types";

type RegisterValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
};

type PasswordRequirement = {
  label: string;
  test: (value: string) => boolean;
};

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /[0-9]/.test(value) },
  { label: "Not just letters or numbers", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const getPasswordScore = (password: string) => {
  if (!password) {
    return 0;
  }

  return Math.round((passwordRequirements.filter((requirement) => requirement.test(password)).length / passwordRequirements.length) * 100);
};

const getPasswordStrength = (score: number) => {
  if (score < 40) {
    return { color: "red", label: "Weak" };
  }

  if (score < 80) {
    return { color: "yellow", label: "Good" };
  }

  return { color: "teal", label: "Strong" };
};

const Register = () => {
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "USER"
    },
    validate: {
      firstName: (value) => (value.trim().length >= 2 ? null : "First name must be at least 2 characters"),
      lastName: (value) => (value.trim().length >= 2 ? null : "Last name must be at least 2 characters"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
      password: (value) => (passwordRequirements.slice(0, 4).every((requirement) => requirement.test(value)) ? null : "Password is too weak")
    }
  });

  const passwordScore = getPasswordScore(form.values.password);
  const passwordStrength = getPasswordStrength(passwordScore);

  const handleSubmit = async (values: RegisterValues) => {
    const response = await api.post<ApiResponse<OtpResponse>>("/auth/register", values);
    const otpData = response.data.data;

    notifications.show({
      color: "blue",
      title: "Verify your email",
      message: otpData.devOtp ? `Development OTP: ${otpData.devOtp}` : "Check your email for the OTP."
    });

    navigate("/verify-otp", { state: { email: otpData.email, devOtp: otpData.devOtp } });
  };

  return (
    <main className="auth-page">
      <Paper w="100%" maw={560} radius="md" p="xl" shadow="sm" withBorder>
        <Stack gap="lg">
          <div>
            <ThemeIcon size={44} radius="md" color="teal">
              <IconUserPlus size={22} />
            </ThemeIcon>
            <Title order={1} mt="md" size="h2">
              Create account
            </Title>
            <Text c="dimmed" size="sm">
              Register a test account, choose a role, then verify the signup OTP.
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="First name" autoComplete="given-name" required {...form.getInputProps("firstName")} />
                <TextInput label="Last name" autoComplete="family-name" required {...form.getInputProps("lastName")} />
              </SimpleGrid>
              <TextInput label="Email" type="email" autoComplete="email" required {...form.getInputProps("email")} />
              <Select
                label="Account role"
                data={[
                  { value: "USER", label: "User" },
                  { value: "INSPECTOR", label: "Inspector" },
                  { value: "ADMIN", label: "Admin" }
                ]}
                required
                {...form.getInputProps("role")}
              />
              <PasswordInput label="Password" autoComplete="new-password" required {...form.getInputProps("password")} />

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
                Create account
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm" c="dimmed">
            Already registered?{" "}
            <Anchor component={Link} to="/login">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </main>
  );
};

export default Register;
