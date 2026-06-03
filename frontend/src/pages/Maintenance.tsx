import { Badge, Button, Card, Drawer, Group, Select, SimpleGrid, Stack, Table, Text, TextInput, Textarea, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, ExtinguisherStatus, FireExtinguisher, MaintenanceLog } from "../types";

type MaintenanceValues = {
  extinguisherId: string;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified: string;
  recommendations: string;
  nextStatus: ExtinguisherStatus;
};

const statusOptions: ExtinguisherStatus[] = ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"];

const Maintenance = () => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [opened, { close, open }] = useDisclosure(false);
  const canLog = hasRole(["ADMIN", "INSPECTOR"]);

  const form = useForm<MaintenanceValues>({
    initialValues: {
      extinguisherId: "",
      actionTaken: "",
      maintenanceDate: new Date().toISOString().slice(0, 10),
      issuesIdentified: "",
      recommendations: "",
      nextStatus: "ACTIVE"
    },
    validate: {
      extinguisherId: (value) => (value ? null : "Select an extinguisher"),
      actionTaken: (value) => (value.trim().length >= 2 ? null : "Action taken is required")
    }
  });

  const fetchData = async () => {
    const [logResponse, extinguisherResponse] = await Promise.all([
      api.get<ApiResponse<{ maintenanceLogs: MaintenanceLog[] }>>("/maintenance"),
      api.get<ApiResponse<{ extinguishers: FireExtinguisher[] }>>("/extinguishers?limit=100")
    ]);
    setLogs(logResponse.data.data.maintenanceLogs);
    setExtinguishers(extinguisherResponse.data.data.extinguishers);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logMaintenance = async (values: MaintenanceValues) => {
    await api.post("/maintenance", values);
    notifications.show({ color: "green", title: "Maintenance logged", message: "Activity history updated." });
    form.reset();
    form.setFieldValue("maintenanceDate", new Date().toISOString().slice(0, 10));
    form.setFieldValue("nextStatus", "ACTIVE");
    close();
    await fetchData();
  };

  const extinguisherOptions = extinguishers.map((extinguisher) => ({
    value: extinguisher.id,
    label: `${extinguisher.serialNumber} - ${extinguisher.location}`
  }));

  return (
    <Stack gap="lg">
      <Group className="page-header" justify="space-between" align="flex-start">
        <div className="page-title-copy">
          <Text className="page-kicker">Operations</Text>
          <Title order={1}>Maintenance</Title>
          <Text c="dimmed">Log repair actions, recurring issues, and recommendations for compliance history.</Text>
        </div>
        {canLog ? (
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Log maintenance
          </Button>
        ) : null}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card className="enterprise-card kpi-card" p="md">
          <Text className="section-label">Records</Text>
          <Text fw={800} fz={28}>
            {logs.length}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--warning" p="md">
          <Text className="section-label">Issues</Text>
          <Text fw={800} fz={28}>
            {logs.filter((log) => Boolean(log.issuesIdentified)).length}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--success" p="md">
          <Text className="section-label">Assets Linked</Text>
          <Text fw={800} fz={28}>
            {new Set(logs.map((log) => log.extinguisherId)).size}
          </Text>
        </Card>
      </SimpleGrid>

      {canLog ? (
        <Drawer opened={opened} onClose={close} title="Log maintenance" position="right" size={560}>
          <form onSubmit={form.onSubmit(logMaintenance)}>
            <Stack>
              <Group className="responsive-form-row" grow align="flex-start">
                <Select label="Fire extinguisher" data={extinguisherOptions} searchable required {...form.getInputProps("extinguisherId")} />
                <TextInput label="Maintenance date" type="date" required {...form.getInputProps("maintenanceDate")} />
                <Select label="Next status" data={statusOptions} required {...form.getInputProps("nextStatus")} />
              </Group>
              <Textarea label="Action taken" minRows={3} required {...form.getInputProps("actionTaken")} />
              <Group className="responsive-form-row" grow align="flex-start">
                <Textarea label="Issues identified" minRows={3} {...form.getInputProps("issuesIdentified")} />
                <Textarea label="Recommendations" minRows={3} {...form.getInputProps("recommendations")} />
              </Group>
              <Group justify="flex-end">
                <Button type="submit" leftSection={<IconPlus size={16} />} loading={form.submitting}>
                  Log maintenance
                </Button>
              </Group>
            </Stack>
          </form>
        </Drawer>
      ) : null}

      <Card className="enterprise-card" p="lg">
        <Table.ScrollContainer minWidth={920}>
          <Table className="data-table" striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Extinguisher</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Issues</Table.Th>
                <Table.Th>Inspector</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text fw={700}>{log.extinguisher?.serialNumber || log.extinguisherId}</Text>
                    <Text size="sm" c="dimmed">
                      {log.extinguisher?.location || "Location unavailable"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{new Date(log.maintenanceDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Text lineClamp={2}>{log.actionTaken}</Text>
                  </Table.Td>
                  <Table.Td>
                    {log.issuesIdentified ? (
                      <Badge className="status-chip" color="orange">
                        Issues recorded
                      </Badge>
                    ) : (
                      <Badge className="status-chip" color="teal">
                        Clear
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>{log.inspector ? `${log.inspector.firstName} ${log.inspector.lastName}` : "Unknown"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {logs.length === 0 ? <div className="empty-state">No maintenance logs have been recorded yet.</div> : null}
      </Card>
    </Stack>
  );
};

export default Maintenance;
