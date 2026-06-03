import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, User } from "../types";

type ProfileValues = {
  firstName: string;
  lastName: string;
};

const Profile = () => {
  const { user, updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);

  const form = useForm<ProfileValues>({
    initialValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || ""
    },
    validate: {
      firstName: (value) => (value.trim().length >= 2 ? null : "First name must be at least 2 characters"),
      lastName: (value) => (value.trim().length >= 2 ? null : "Last name must be at least 2 characters")
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        return;
      }

      const response = await api.get<ApiResponse<{ user: User }>>(`/users/${user.id}`);
      const nextProfile = response.data.data.user;
      setProfile(nextProfile);
      form.setValues({
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName
      });
      updateCurrentUser(nextProfile);
    };

    fetchProfile();
  }, [user?.id]);

  const saveProfile = async (values: ProfileValues) => {
    if (!user?.id) {
      return;
    }

    const response = await api.patch<ApiResponse<{ user: User }>>(`/users/${user.id}`, values);
    const nextProfile = response.data.data.user;
    setProfile(nextProfile);
    updateCurrentUser(nextProfile);
    notifications.show({
      color: "green",
      title: "Profile updated",
      message: "Your profile changes have been saved."
    });
  };

  return (
    <Stack gap="lg">
      <Group className="page-header" justify="space-between" align="flex-start">
        <div className="page-title-copy">
          <Text className="page-kicker">Account</Text>
          <Title order={1}>My Profile</Title>
          <Text c="dimmed">Manage your personal account details.</Text>
        </div>
        <Badge color={profile?.emailVerified ? "teal" : "gray"} size="lg" radius="sm">
          {profile?.emailVerified ? "Verified" : "Pending verification"}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        <Card className="enterprise-card dashboard-wide" p="lg">
          <Text className="section-label">Editable details</Text>
          <form onSubmit={form.onSubmit(saveProfile)}>
            <Stack mt="md">
              <Group className="responsive-form-row" grow>
                <TextInput label="First name" required {...form.getInputProps("firstName")} />
                <TextInput label="Last name" required {...form.getInputProps("lastName")} />
              </Group>
              <Group justify="flex-end">
                <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={form.submitting}>
                  Save profile
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>

        <Card className="enterprise-card" p="lg">
          <Text className="section-label">Account</Text>
          <Stack gap="md" mt="md">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Email
              </Text>
              <Text>{profile?.email || user?.email}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Role
              </Text>
              <Text>{profile?.role || user?.role}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                User ID
              </Text>
              <Text size="sm" c="dimmed" lineClamp={1}>
                {profile?.id || user?.id}
              </Text>
            </div>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};

export default Profile;
