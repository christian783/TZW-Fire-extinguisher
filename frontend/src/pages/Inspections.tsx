import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, FireExtinguisher, Inspection, InspectionResult, InspectionStatus } from "../types";

const statusOptions: InspectionStatus[] = ["SCHEDULED", "COMPLETED", "OVERDUE", "CANCELLED"];
const resultOptions: InspectionResult[] = ["PASS", "FAIL", "NEEDS_MAINTENANCE"];

const statusColor: Record<InspectionStatus, string> = {
  SCHEDULED: "blue",
  COMPLETED: "teal",
  OVERDUE: "red",
  CANCELLED: "gray"
};

type InspectionValues = {
  extinguisherId: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
};

const Inspections = () => {
  const { hasRole, isAdmin } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [opened, { close, open }] = useDisclosure(false);
  const canComplete = hasRole(["ADMIN", "INSPECTOR"]);

  const form = useForm<InspectionValues>({
    initialValues: {
      extinguisherId: "",
      scheduledDate: new Date().toISOString().slice(0, 10),
      scheduledTime: "09:00",
      notes: ""
    },
    validate: {
      extinguisherId: (value) => (value ? null : "Select an extinguisher"),
      scheduledDate: (value) => (value ? null : "Choose a date"),
      scheduledTime: (value) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? null : "Use HH:mm")
    }
  });

  const fetchData = async () => {
    const [inspectionResponse, extinguisherResponse] = await Promise.all([
      api.get<ApiResponse<{ inspections: Inspection[] }>>("/inspections"),
      api.get<ApiResponse<{ extinguishers: FireExtinguisher[] }>>("/extinguishers?limit=100")
    ]);
    setInspections(inspectionResponse.data.data.inspections);
    setExtinguishers(extinguisherResponse.data.data.extinguishers);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scheduleInspection = async (values: InspectionValues) => {
    const response = await api.post<ApiResponse<{ inspection: Inspection; notification?: { message: string } }>>("/inspections", values);
    notifications.show({
      color: "green",
      title: "Inspection scheduled",
      message: response.data.data.notification?.message || "Relevant personnel can now be notified."
    });
    close();
    await fetchData();
  };

  const updateInspection = async (inspection: Inspection, payload: Partial<Inspection>) => {
    await api.patch(`/inspections/${inspection.id}`, payload);
    notifications.show({ color: "green", title: "Inspection updated", message: inspection.extinguisher?.serialNumber || inspection.id });
    await fetchData();
  };

  const deleteInspection = async (inspection: Inspection) => {
    await api.delete(`/inspections/${inspection.id}`);
    notifications.show({ color: "green", title: "Inspection deleted", message: inspection.extinguisher?.serialNumber || inspection.id });
    await fetchData();
  };

  const extinguisherOptions = extinguishers.map((extinguisher) => ({
    value: extinguisher.id,
    label: `${extinguisher.serialNumber} - ${extinguisher.location}`
  }));
  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() + index);
      const dayKey = day.toISOString().slice(0, 10);

      return {
        key: dayKey,
        label: day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
        inspections: inspections.filter((inspection) => inspection.scheduledDate.slice(0, 10) === dayKey)
      };
    });
  }, [inspections]);
  const overdueCount = inspections.filter((inspection) => inspection.status === "OVERDUE").length;
  const scheduledCount = inspections.filter((inspection) => inspection.status === "SCHEDULED").length;
  const completedCount = inspections.filter((inspection) => inspection.status === "COMPLETED").length;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text className="page-kicker">Operations</Text>
          <Title order={1}>Inspections</Title>
          <Text c="dimmed">Schedule inspections, record outcomes, and trigger operational notifications.</Text>
        </div>
        <Group>
          <SegmentedControl
            value={view}
            onChange={(value) => setView(value as "list" | "calendar")}
            data={[
              { label: "List", value: "list" },
              { label: "Calendar", value: "calendar" }
            ]}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            Schedule inspection
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card className="enterprise-card kpi-card kpi-card--warning" p="md">
          <Text className="section-label">Scheduled</Text>
          <Text fw={800} fz={28}>
            {scheduledCount}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--success" p="md">
          <Text className="section-label">Completed</Text>
          <Text fw={800} fz={28}>
            {completedCount}
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--danger" p="md">
          <Text className="section-label">Overdue</Text>
          <Text fw={800} fz={28}>
            {overdueCount}
          </Text>
        </Card>
      </SimpleGrid>

      <Card className="enterprise-card" p="lg">
        {view === "list" ? (
          <Table.ScrollContainer minWidth={920}>
            <Table className="data-table" striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Extinguisher</Table.Th>
                  <Table.Th>Schedule</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Result</Table.Th>
                  <Table.Th>Inspector</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {inspections.map((inspection) => (
                  <Table.Tr key={inspection.id}>
                    <Table.Td>
                      <Text fw={700}>{inspection.extinguisher?.serialNumber || inspection.extinguisherId}</Text>
                      <Text size="sm" c="dimmed">
                        {inspection.extinguisher?.location || "Location unavailable"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {new Date(inspection.scheduledDate).toLocaleDateString()} at {inspection.scheduledTime.slice(0, 5)}
                    </Table.Td>
                    <Table.Td>
                      {canComplete ? (
                        <Select
                          w={170}
                          value={inspection.status}
                          data={statusOptions}
                          onChange={(status) => status && updateInspection(inspection, { status: status as InspectionStatus })}
                        />
                      ) : (
                        <Badge className="status-chip" color={statusColor[inspection.status]}>
                          {inspection.status.replaceAll("_", " ")}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {canComplete ? (
                        <Select
                          w={190}
                          value={inspection.result || null}
                          placeholder="Record result"
                          data={resultOptions}
                          onChange={(result) => result && updateInspection(inspection, { result: result as InspectionResult })}
                        />
                      ) : (
                        inspection.result || "-"
                      )}
                    </Table.Td>
                    <Table.Td>{inspection.inspector ? `${inspection.inspector.firstName} ${inspection.inspector.lastName}` : "Unassigned"}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="xs">
                        {canComplete ? (
                          <ActionIcon
                            variant="subtle"
                            aria-label="Complete inspection"
                            onClick={() => updateInspection(inspection, { status: "COMPLETED", result: inspection.result || "PASS" })}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        ) : null}
                        {isAdmin() ? (
                          <ActionIcon variant="subtle" color="red" aria-label="Delete inspection" onClick={() => deleteInspection(inspection)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        ) : null}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {calendarDays.map((day) => (
              <Card key={day.key} withBorder radius="sm" p="md">
                <Group justify="space-between" mb="sm">
                  <Text fw={800}>{day.label}</Text>
                  <Badge color={day.inspections.length ? "blue" : "gray"}>{day.inspections.length}</Badge>
                </Group>
                <Stack gap="xs">
                  {day.inspections.map((inspection) => (
                    <div key={inspection.id}>
                      <Text fw={700} size="sm">
                        {inspection.scheduledTime.slice(0, 5)} / {inspection.extinguisher?.serialNumber || inspection.extinguisherId}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {inspection.extinguisher?.location || "Location unavailable"}
                      </Text>
                    </div>
                  ))}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
        {inspections.length === 0 ? <div className="empty-state">No inspections have been scheduled yet.</div> : null}
      </Card>

      <Modal opened={opened} onClose={close} title="Schedule inspection" size={560}>
        <form onSubmit={form.onSubmit(scheduleInspection)}>
          <Stack>
            <Select label="Fire extinguisher" data={extinguisherOptions} searchable required {...form.getInputProps("extinguisherId")} />
            <Group grow>
              <TextInput label="Inspection date" type="date" required {...form.getInputProps("scheduledDate")} />
              <TextInput label="Inspection time" type="time" required {...form.getInputProps("scheduledTime")} />
            </Group>
            <Textarea label="Notes" minRows={3} {...form.getInputProps("notes")} />
            <Button type="submit" loading={form.submitting}>
              Schedule inspection
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default Inspections;
