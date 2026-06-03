import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import { ApiResponse, OtpResponse, Role, User } from "../types";
import { isPasswordValid, passwordValidationMessage } from "../utils/passwordRules";

type CreateUserValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  emailVerified: boolean;
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [opened, { close, open }] = useDisclosure(false);
  const createForm = useForm<CreateUserValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "USER",
      emailVerified: false
    },
    validate: {
      firstName: (value) => (value.trim().length >= 2 ? null : "First name must be at least 2 characters"),
      lastName: (value) => (value.trim().length >= 2 ? null : "Last name must be at least 2 characters"),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Enter a valid email"),
      password: (value) => (isPasswordValid(value) ? null : passwordValidationMessage)
    }
  });

  const fetchUsers = async () => {
    const response = await api.get<ApiResponse<{ users: User[] }>>("/users");
    setUsers(response.data.data.users);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (user: User, payload: Partial<User>) => {
    await api.patch(`/users/${user.id}`, payload);
    notifications.show({ color: "green", title: "User updated", message: user.email });
    await fetchUsers();
  };

  const createUser = async (values: CreateUserValues) => {
    const response = await api.post<ApiResponse<OtpResponse>>("/auth/register", {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role
    });

    if (values.emailVerified) {
      await api.patch(`/users/${response.data.data.userId}`, {
        role: values.role,
        emailVerified: true
      });
    }

    notifications.show({
      color: "green",
      title: "User created",
      message: values.emailVerified ? `${values.email} is active.` : `Verification OTP sent to ${values.email}.`
    });
    createForm.reset();
    close();
    await fetchUsers();
  };

  const deleteUser = async (user: User) => {
    await api.delete(`/users/${user.id}`);
    notifications.show({ color: "green", title: "User deleted", message: user.email });
    await fetchUsers();
  };
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return users.filter((user) => {
      const name = `${user.firstName} ${user.lastName}`.toLowerCase();
      return !needle || name.includes(needle) || user.email.toLowerCase().includes(needle) || user.role.toLowerCase().includes(needle);
    });
  }, [query, users]);
  const roleCounts = {
    ADMIN: users.filter((user) => user.role === "ADMIN").length,
    INSPECTOR: users.filter((user) => user.role === "INSPECTOR").length,
    USER: users.filter((user) => user.role === "USER").length
  };

  return (
    <Stack gap="lg">
      <Group className="page-header" justify="space-between" align="flex-start">
        <div className="page-title-copy">
          <Text className="page-kicker">Administration</Text>
          <Title order={1}>Users</Title>
          <Text c="dimmed">Admin-only RBAC management.</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Create user
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 4 }}>
        <Card className="enterprise-card kpi-card" p="md">
          <Text className="section-label">Users</Text>
          <Text fw={800} fz={28}>
            {users.length}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--danger" p="md">
          <Text className="section-label">Admins</Text>
          <Text fw={800} fz={28}>
            {roleCounts.ADMIN}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--warning" p="md">
          <Text className="section-label">Inspectors</Text>
          <Text fw={800} fz={28}>
            {roleCounts.INSPECTOR}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--success" p="md">
          <Text className="section-label">Read-only</Text>
          <Text fw={800} fz={28}>
            {roleCounts.USER}
          </Text>
        </Card>
      </SimpleGrid>

      <Card className="enterprise-card" p="lg">
        <div className="toolbar">
          <TextInput label="Search users" placeholder="Name, email, or role" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        </div>
        <Table.ScrollContainer minWidth={760}>
          <Table className="data-table" striped highlightOnHover verticalSpacing="sm" mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Verified</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Text fw={600}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {user.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Badge className="status-chip" color={user.role === "ADMIN" ? "red" : user.role === "INSPECTOR" ? "blue" : "gray"}>
                        {user.role}
                      </Badge>
                      <Select
                        w={150}
                        value={user.role}
                        data={["ADMIN", "INSPECTOR", "USER"]}
                        onChange={(role) => role && updateUser(user, { role: role as Role })}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Switch checked={Boolean(user.emailVerified)} onChange={(event) => updateUser(user, { emailVerified: event.currentTarget.checked })} />
                      <Badge color={user.emailVerified ? "teal" : "gray"}>{user.emailVerified ? "Verified" : "Pending"}</Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <ActionIcon variant="subtle" color="red" aria-label="Delete user" onClick={() => deleteUser(user)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {filteredUsers.length === 0 ? <div className="empty-state">No users match the active search.</div> : null}
      </Card>

      <Modal opened={opened} onClose={close} title="Create user" size={560}>
        <form onSubmit={createForm.onSubmit(createUser)}>
          <Stack>
            <Group className="responsive-form-row" grow>
              <TextInput label="First name" required {...createForm.getInputProps("firstName")} />
              <TextInput label="Last name" required {...createForm.getInputProps("lastName")} />
            </Group>
            <TextInput label="Email" type="email" required {...createForm.getInputProps("email")} />
            <PasswordInput label="Temporary password" required {...createForm.getInputProps("password")} />
            <Select
              label="Role"
              data={[
                { value: "USER", label: "User" },
                { value: "INSPECTOR", label: "Inspector" },
                { value: "ADMIN", label: "Admin" }
              ]}
              required
              {...createForm.getInputProps("role")}
            />
            <Switch
              label="Mark email as verified"
              description="When disabled, the user must verify using the emailed OTP."
              checked={createForm.values.emailVerified}
              onChange={(event) => createForm.setFieldValue("emailVerified", event.currentTarget.checked)}
            />
            <Group justify="flex-end">
              <Button type="submit" leftSection={<IconPlus size={16} />} loading={createForm.submitting}>
                Create user
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default Users;
