import { Badge, Button, Card, Group, SimpleGrid, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChecklist, IconDownload, IconFileAnalytics } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import api from "../api/axios";
import { ApiResponse, DashboardReport } from "../types";

type ReportType = "inventory" | "inspections" | "compliance" | "maintenance";
type ExportFormat = "csv" | "pdf";

const reportTypes: ReportType[] = ["inventory", "inspections", "compliance", "maintenance"];

const Reports = () => {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const fetchReports = async () => {
      const response = await api.get<ApiResponse<DashboardReport>>("/reports/dashboard");
      setReport(response.data.data);
    };

    fetchReports();
  }, []);

  const exportReport = async (reportType: ReportType, format: ExportFormat) => {
    const response = await api.get(`/reports/${reportType}/export`, {
      params: { format, fromDate, toDate },
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: format === "pdf" ? "application/pdf" : "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-report.${format}`;
    link.click();
    window.URL.revokeObjectURL(url);
    notifications.show({ color: "green", title: "Export ready", message: `${reportType} ${format.toUpperCase()} downloaded.` });
  };

  return (
    <Stack gap="lg">
      <Group className="page-header" justify="space-between" align="flex-start">
        <div className="page-title-copy">
          <Text className="page-kicker">Compliance</Text>
          <Title order={1}>Reports</Title>
          <Text c="dimmed">Real-time inventory, inspection, compliance, and maintenance reporting with CSV/PDF exports.</Text>
        </div>
        <Badge color="blue" variant="light" size="lg" radius="sm">
          Reporting Service
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 4 }}>
        <Card className="enterprise-card kpi-card" p="lg">
          <Text className="section-label">Total extinguishers</Text>
          <Text fw={800} fz={30}>
            {report?.inventory.totalExtinguishers ?? "-"}
          </Text>
          <Text size="sm" c="dimmed">
            Inventory baseline
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--danger" p="lg">
          <Text className="section-label">Overdue inspections</Text>
          <Text fw={800} fz={30}>
            {report?.inspections.overdueInspections ?? "-"}
          </Text>
          <Text size="sm" c="dimmed">
            Schedule exposure
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--success" p="lg">
          <Text className="section-label">Compliance</Text>
          <Text fw={800} fz={30}>
            {report?.compliance.complianceStatus.percentage ?? "-"}%
          </Text>
          <Text size="sm" c="dimmed">
            Active readiness
          </Text>
        </Card>
        <Card className="enterprise-card kpi-card kpi-card--warning" p="lg">
          <Text className="section-label">Maintenance records</Text>
          <Text fw={800} fz={30}>
            {report?.maintenance.maintenanceHistory ?? "-"}
          </Text>
          <Text size="sm" c="dimmed">
            Service ledger
          </Text>
        </Card>
      </SimpleGrid>

      <Card className="enterprise-card" p="lg">
        <Group className="page-header" justify="space-between" align="flex-end" mb="md">
          <div className="page-title-copy">
            <Text className="section-label">Exports</Text>
            <Title order={2} size="h3">
              Report Packages
            </Title>
          </div>
          <Group className="toolbar report-toolbar">
            <TextInput label="From" type="date" value={fromDate} onChange={(event) => setFromDate(event.currentTarget.value)} />
            <TextInput label="To" type="date" value={toDate} onChange={(event) => setToDate(event.currentTarget.value)} />
          </Group>
        </Group>
        <Table.ScrollContainer minWidth={620}>
          <Table className="data-table" striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Report</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {reportTypes.map((reportType) => (
                <Table.Tr key={reportType}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconFileAnalytics size={18} />
                      <Text fw={700}>{reportType[0].toUpperCase() + reportType.slice(1)}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      Export current {reportType} data from the Reporting Service.
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group className="page-actions" justify="flex-end" gap="xs">
                      <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} onClick={() => exportReport(reportType, "csv")}>
                        CSV
                      </Button>
                      <Button variant="light" size="xs" leftSection={<IconChecklist size={14} />} onClick={() => exportReport(reportType, "pdf")}>
                        PDF
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
};

export default Reports;
