import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Select,
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
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, ExtinguisherSize, ExtinguisherStatus, ExtinguisherType, FireExtinguisher } from "../types";

const typeOptions: ExtinguisherType[] = ["WATER", "CO2", "FOAM", "DRY_CHEMICAL"];
const sizeOptions: ExtinguisherSize[] = ["2.5 lb", "5 lb", "9 lb", "12 lb"];
const statusOptions: ExtinguisherStatus[] = ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"];

const statusColor: Record<ExtinguisherStatus, string> = {
  ACTIVE: "teal",
  DUE_FOR_INSPECTION: "yellow",
  MAINTENANCE_REQUIRED: "orange",
  EXPIRED: "red",
  RETIRED: "gray"
};

type ExtinguisherValues = {
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
  notes: string;
};

const Extinguishers = () => {
  const { hasRole, isAdmin } = useAuth();
  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [editing, setEditing] = useState<FireExtinguisher | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExtinguisherStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ExtinguisherType | "ALL">("ALL");
  const [opened, { close, open }] = useDisclosure(false);
  const canManage = hasRole(["ADMIN", "INSPECTOR"]);

  const form = useForm<ExtinguisherValues>({
    initialValues: {
      serialNumber: "",
      location: "",
      type: "CO2",
      size: "5 lb",
      installationDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      status: "ACTIVE",
      notes: ""
    },
    validate: {
      serialNumber: (value) => (value.trim().length >= 2 ? null : "Serial number is required"),
      location: (value) => (value.trim().length >= 2 ? null : "Location is required"),
      expiryDate: (value, values) => (value > values.installationDate ? null : "Expiry must be after installation")
    }
  });

  const modalTitle = useMemo(() => (editing ? "Edit extinguisher" : "Register extinguisher"), [editing]);
  const filteredExtinguishers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return extinguishers.filter((extinguisher) => {
      const matchesSearch =
        !needle ||
        extinguisher.serialNumber.toLowerCase().includes(needle) ||
        extinguisher.location.toLowerCase().includes(needle) ||
        (extinguisher.notes || "").toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "ALL" || extinguisher.status === statusFilter;
      const matchesType = typeFilter === "ALL" || extinguisher.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [extinguishers, query, statusFilter, typeFilter]);
  const dueCount = extinguishers.filter((extinguisher) => extinguisher.status === "DUE_FOR_INSPECTION").length;
  const maintenanceCount = extinguishers.filter((extinguisher) => extinguisher.status === "MAINTENANCE_REQUIRED").length;

  const fetchExtinguishers = async () => {
    const response = await api.get<ApiResponse<{ extinguishers: FireExtinguisher[] }>>("/extinguishers");
    setExtinguishers(response.data.data.extinguishers);
  };

  useEffect(() => {
    fetchExtinguishers();
  }, []);

  const startCreate = () => {
    setEditing(null);
    form.setValues({
      serialNumber: "",
      location: "",
      type: "CO2",
      size: "5 lb",
      installationDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      status: "ACTIVE",
      notes: ""
    });
    open();
  };

  const startEdit = (extinguisher: FireExtinguisher) => {
    setEditing(extinguisher);
    form.setValues({
      serialNumber: extinguisher.serialNumber,
      location: extinguisher.location,
      type: extinguisher.type,
      size: extinguisher.size,
      installationDate: extinguisher.installationDate,
      expiryDate: extinguisher.expiryDate,
      status: extinguisher.status,
      notes: extinguisher.notes || ""
    });
    open();
  };

  const saveExtinguisher = async (values: ExtinguisherValues) => {
    if (editing) {
      await api.patch(`/extinguishers/${editing.id}`, values);
      notifications.show({ color: "green", title: "Extinguisher updated", message: values.serialNumber });
    } else {
      await api.post("/extinguishers", values);
      notifications.show({ color: "green", title: "Extinguisher registered", message: values.serialNumber });
    }

    close();
    await fetchExtinguishers();
  };

  const deleteExtinguisher = async (extinguisher: FireExtinguisher) => {
    await api.delete(`/extinguishers/${extinguisher.id}`);
    notifications.show({ color: "green", title: "Extinguisher deleted", message: extinguisher.serialNumber });
    await fetchExtinguishers();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text className="page-kicker">Equipment</Text>
          <Title order={1}>Fire Extinguishers</Title>
          <Text c="dimmed">Inventory registration, status tracking, and lifecycle management.</Text>
        </div>
        {canManage ? (
          <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>
            Register extinguisher
          </Button>
        ) : null}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card className="enterprise-card kpi-card" p="md">
          <Text className="section-label">Inventory</Text>
          <Text fw={800} fz={28}>
            {extinguishers.length}
          </Text>
          <Text size="sm" c="dimmed">
            Registered assets
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--warning" p="md">
          <Text className="section-label">Due</Text>
          <Text fw={800} fz={28}>
            {dueCount}
          </Text>
          <Text size="sm" c="dimmed">
            Awaiting inspection
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--danger" p="md">
          <Text className="section-label">Maintenance</Text>
          <Text fw={800} fz={28}>
            {maintenanceCount}
          </Text>
          <Text size="sm" c="dimmed">
            Requires service
          </Text>
        </Card>
      </SimpleGrid>

      <Card className="enterprise-card" p="lg">
        <div className="toolbar">
          <div className="filter-grid">
            <TextInput label="Search" placeholder="Serial, location, or notes" value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
            <Select
              label="Status"
              data={["ALL", ...statusOptions]}
              value={statusFilter}
              onChange={(value) => setStatusFilter((value as ExtinguisherStatus | "ALL") || "ALL")}
            />
            <Select
              label="Type"
              data={["ALL", ...typeOptions]}
              value={typeFilter}
              onChange={(value) => setTypeFilter((value as ExtinguisherType | "ALL") || "ALL")}
            />
            <TextInput label="Rows shown" value={`${filteredExtinguishers.length} of ${extinguishers.length}`} readOnly />
          </div>
        </div>
        <Table.ScrollContainer minWidth={900}>
          <Table className="data-table" striped highlightOnHover verticalSpacing="sm" mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Serial</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Expiry</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredExtinguishers.map((extinguisher) => (
                <Table.Tr key={extinguisher.id}>
                  <Table.Td>
                    <Text fw={700}>{extinguisher.serialNumber}</Text>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {extinguisher.notes || "No notes"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{extinguisher.location}</Table.Td>
                  <Table.Td>{extinguisher.type.replace("_", " ")}</Table.Td>
                  <Table.Td>{extinguisher.size}</Table.Td>
                  <Table.Td>
                    <Badge
                      className={`status-chip ${extinguisher.status === "EXPIRED" ? "pulse-danger" : ""}`}
                      color={statusColor[extinguisher.status]}
                    >
                      {extinguisher.status.replaceAll("_", " ")}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{new Date(extinguisher.expiryDate).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      {canManage ? (
                        <ActionIcon variant="subtle" aria-label="Edit extinguisher" onClick={() => startEdit(extinguisher)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      ) : null}
                      {isAdmin() ? (
                        <ActionIcon variant="subtle" color="red" aria-label="Delete extinguisher" onClick={() => deleteExtinguisher(extinguisher)}>
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
        {filteredExtinguishers.length === 0 ? <div className="empty-state">No extinguishers match the active filters.</div> : null}
      </Card>

      <Modal opened={opened} onClose={close} title={modalTitle} size={560}>
        <form onSubmit={form.onSubmit(saveExtinguisher)}>
          <Stack>
            <TextInput label="Serial number" required {...form.getInputProps("serialNumber")} />
            <TextInput label="Location" required {...form.getInputProps("location")} />
            <Group grow>
              <Select label="Type" data={typeOptions} required {...form.getInputProps("type")} />
              <Select label="Size" data={sizeOptions} required {...form.getInputProps("size")} />
            </Group>
            <Group grow>
              <TextInput label="Installation date" type="date" required {...form.getInputProps("installationDate")} />
              <TextInput label="Expiry date" type="date" required {...form.getInputProps("expiryDate")} />
            </Group>
            <Select label="Status" data={statusOptions} required {...form.getInputProps("status")} />
            <Textarea label="Notes" minRows={3} {...form.getInputProps("notes")} />
            <Button type="submit" loading={form.submitting}>
              Save extinguisher
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default Extinguishers;
