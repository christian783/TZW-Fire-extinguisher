import { Badge, Card, Group, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendarStats,
  IconClipboardCheck,
  IconDatabase,
  IconShieldCheck,
  IconTool
} from "@tabler/icons-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ApiResponse, DashboardReport, Inspection, MaintenanceLog, User } from "../types";

const Dashboard = () => {
  const { user, isAdmin, hasRole } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const canViewReports = hasRole(["ADMIN", "INSPECTOR"]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const profileResponse = await api.get<ApiResponse<{ user: User }>>("/auth/me");
      setProfile(profileResponse.data.data.user);

      if (canViewReports) {
        const [reportResponse, inspectionResponse, maintenanceResponse] = await Promise.all([
          api.get<ApiResponse<DashboardReport>>("/reports/dashboard"),
          api.get<ApiResponse<{ inspections: Inspection[] }>>("/inspections?limit=8"),
          api.get<ApiResponse<{ maintenanceLogs: MaintenanceLog[] }>>("/maintenance?limit=6")
        ]);
        setReport(reportResponse.data.data);
        setInspections(inspectionResponse.data.data.inspections);
        setMaintenanceLogs(maintenanceResponse.data.data.maintenanceLogs);
      }
    };

    fetchDashboard();
  }, [canViewReports]);

  const accessLabel = isAdmin() ? "Administrator" : hasRole("INSPECTOR") ? "Inspector" : "Read-only user";
  const compliance = report?.compliance.complianceStatus.percentage ?? 0;
  const upcoming = report?.compliance.upcomingExpirations.slice(0, 4) ?? [];
  const overdueCount = report?.inspections.overdueInspections ?? 0;

  const recentInspections = useMemo(() => inspections.slice(0, 6), [inspections]);
  const maintenanceMaximum = Math.max(maintenanceLogs.length, 1);

  return (
    <Stack gap="lg">
      <Group className="page-header" justify="space-between" align="flex-end">
        <div className="page-title-copy">
          <Text className="page-kicker">Command overview</Text>
          <Title order={1}>Fire Safety Dashboard</Title>
          <Text c="dimmed">Operational readiness, compliance exposure, and active inspection workload.</Text>
        </div>
        <Badge color={isAdmin() ? "blue" : hasRole("INSPECTOR") ? "teal" : "gray"} size="lg" radius="sm">
          {accessLabel}
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Card className="enterprise-card kpi-card" p="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text className="section-label">Total Extinguishers</Text>
              <Text fw={800} fz={34}>
                {report?.inventory.totalExtinguishers ?? "-"}
              </Text>
              <Badge color="blue" variant="light">
                Inventory live
              </Badge>
            </div>
            <span className="kpi-icon">
              <IconDatabase size={21} />
            </span>
          </Group>
        </Card>

        <Card className="enterprise-card kpi-card kpi-card--warning" p="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text className="section-label">Inspections Due</Text>
              <Text fw={800} fz={34}>
                {report?.inspections.pendingInspections ?? "-"}
              </Text>
              <Badge color="yellow" variant="light">
                Scheduled queue
              </Badge>
            </div>
            <span className="kpi-icon">
              <IconCalendarStats size={21} />
            </span>
          </Group>
        </Card>

        <Card className="enterprise-card kpi-card kpi-card--danger" p="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text className="section-label">Overdue</Text>
              <Text fw={800} fz={34}>
                {overdueCount}
              </Text>
              <Badge className={overdueCount > 0 ? "pulse-danger" : undefined} color={overdueCount > 0 ? "red" : "green"} variant="light">
                {overdueCount > 0 ? "Action required" : "Clear"}
              </Badge>
            </div>
            <span className="kpi-icon">
              <IconAlertTriangle size={21} />
            </span>
          </Group>
        </Card>

        <Card className="enterprise-card kpi-card kpi-card--success" p="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text className="section-label">Expiring 30 Days</Text>
              <Text fw={800} fz={34}>
                {upcoming.length}
              </Text>
              <Badge color="green" variant="light">
                Lifecycle watch
              </Badge>
            </div>
            <span className="kpi-icon">
              <IconShieldCheck size={21} />
            </span>
          </Group>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        <Card className="enterprise-card dashboard-wide" p="lg">
          <Group justify="space-between" mb="md">
            <div>
              <Text className="section-label">Recent Inspections</Text>
              <Title order={2} size="h3">
                Field Activity
              </Title>
            </div>
            <Group gap="xs">
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">PDF</Badge>
            </Group>
          </Group>
          <Table.ScrollContainer minWidth={760}>
            <Table className="data-table" striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Extinguisher</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Inspector</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentInspections.map((inspection) => (
                  <Table.Tr key={inspection.id}>
                    <Table.Td>
                      <Text fw={700}>{inspection.id.slice(0, 8)}</Text>
                    </Table.Td>
                    <Table.Td>{inspection.extinguisher?.serialNumber || inspection.extinguisherId}</Table.Td>
                    <Table.Td>{inspection.extinguisher?.location || "Location unavailable"}</Table.Td>
                    <Table.Td>
                      {inspection.inspector ? `${inspection.inspector.firstName} ${inspection.inspector.lastName}` : "Unassigned"}
                    </Table.Td>
                    <Table.Td>{new Date(inspection.scheduledDate).toLocaleDateString()}</Table.Td>
                    <Table.Td>
                      <Badge className="status-chip" color={inspection.status === "OVERDUE" ? "red" : inspection.status === "COMPLETED" ? "green" : "blue"}>
                        {inspection.status.replaceAll("_", " ")}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {recentInspections.length === 0 ? <div className="empty-state">No inspection activity is available for this role yet.</div> : null}
        </Card>

        <Card className="enterprise-card" p="lg">
          <Text className="section-label">Compliance</Text>
          <Title order={2} size="h3" mb="md">
            Readiness Ring
          </Title>
          <div className="compliance-ring" style={{ "--ring-value": `${compliance}%` } as CSSProperties}>
            <div className="compliance-ring__inner">
              <Text fw={900} fz={34}>
                {compliance}%
              </Text>
              <Text size="sm" c="dimmed">
                compliant
              </Text>
            </div>
          </div>
          <Stack gap="xs" mt="lg">
            <Group justify="space-between">
              <Text size="sm">Compliant assets</Text>
              <Text fw={700}>{report?.compliance.complianceStatus.compliant ?? "-"}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Expired assets</Text>
              <Text fw={700} c="red">
                {report?.compliance.expiredExtinguishers ?? "-"}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Maintenance records</Text>
              <Text fw={700}>{report?.maintenance.maintenanceHistory ?? "-"}</Text>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Card className="enterprise-card" p="lg">
          <Text className="section-label">Upcoming</Text>
          <Title order={2} size="h3" mb="md">
            Expiration Watch
          </Title>
          <Stack className="mini-timeline" gap="md">
            {upcoming.map((extinguisher) => (
              <div className="mini-timeline__item" key={extinguisher.id}>
                <Text fw={700}>{extinguisher.serialNumber}</Text>
                <Text size="sm" c="dimmed">
                  {extinguisher.location} / {new Date(extinguisher.expiryDate).toLocaleDateString()}
                </Text>
              </div>
            ))}
          </Stack>
          {upcoming.length === 0 ? <div className="empty-state">No upcoming expirations in the current reporting window.</div> : null}
        </Card>

        <Card className="enterprise-card" p="lg">
          <Text className="section-label">Maintenance</Text>
          <Title order={2} size="h3" mb="md">
            Latest Activity
          </Title>
          <Stack gap="md">
            {maintenanceLogs.slice(0, 4).map((log, index) => (
              <div key={log.id}>
                <Group justify="space-between" mb={6}>
                  <Text fw={700} lineClamp={1}>
                    {log.extinguisher?.serialNumber || log.extinguisherId}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(log.maintenanceDate).toLocaleDateString()}
                  </Text>
                </Group>
                <div className="activity-bar">
                  <span style={{ width: `${Math.max(22, ((maintenanceMaximum - index) / maintenanceMaximum) * 100)}%` }} />
                </div>
              </div>
            ))}
          </Stack>
          {maintenanceLogs.length === 0 ? <div className="empty-state">No maintenance activity has been logged yet.</div> : null}
        </Card>

        <Card className="enterprise-card" p="lg">
          <Text className="section-label">Alerts</Text>
          <Title order={2} size="h3" mb="md">
            Compliance Feed
          </Title>
          <Stack gap="sm">
            <Group align="flex-start" gap="sm">
              <IconAlertTriangle color="var(--enterprise-danger)" size={18} />
              <div>
                <Text fw={700}>{overdueCount} overdue inspections</Text>
                <Text size="sm" c="dimmed">
                  Prioritize inspections that have breached schedule.
                </Text>
              </div>
            </Group>
            <Group align="flex-start" gap="sm">
              <IconClipboardCheck color="var(--enterprise-success)" size={18} />
              <div>
                <Text fw={700}>{report?.inspections.completedInspections ?? 0} completed checks</Text>
                <Text size="sm" c="dimmed">
                  Completed records are included in the reporting ledger.
                </Text>
              </div>
            </Group>
            <Group align="flex-start" gap="sm">
              <IconTool color="var(--enterprise-accent)" size={18} />
              <div>
                <Text fw={700}>{report?.maintenance.maintenanceHistory ?? 0} maintenance records</Text>
                <Text size="sm" c="dimmed">
                  Recent repairs and recommendations remain visible to operations.
                </Text>
              </div>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card className="enterprise-card" p="lg">
        <Text className="section-label">Current Profile</Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="md">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Name
            </Text>
            <Text>{profile ? `${profile.firstName} ${profile.lastName}` : `${user?.firstName || ""} ${user?.lastName || ""}`}</Text>
          </div>
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
              Email verified
            </Text>
            <Text>{profile?.emailVerified ? "Yes" : "No"}</Text>
          </div>
        </SimpleGrid>
      </Card>
    </Stack>
  );
};

export default Dashboard;
