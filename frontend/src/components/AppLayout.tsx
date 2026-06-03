import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Burger,
  Divider,
  Group,
  Indicator,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBell,
  IconCalendarStats,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconDashboard,
  IconLogout,
  IconShieldCheck,
  IconTool,
  IconUsers
} from "@tabler/icons-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type NavItem = {
  label: string;
  to: string;
  icon: typeof IconDashboard;
};

const AppLayout = () => {
  const [opened, { close, toggle }] = useDisclosure();
  const [collapsed, { toggle: toggleCollapsed }] = useDisclosure(false);
  const location = useLocation();
  const { user, logout, isAdmin, hasRole } = useAuth();
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Signed in";
  const initials = `${user?.firstName?.[0] || "U"}${user?.lastName?.[0] || ""}`.toUpperCase();

  const navSections: { label: string; items: NavItem[] }[] = [
    {
      label: "Overview",
      items: [{ label: "Dashboard", to: "/dashboard", icon: IconDashboard }]
    },
    {
      label: "Equipment",
      items: [{ label: "Fire Extinguishers", to: "/extinguishers", icon: IconShieldCheck }]
    },
    {
      label: "Operations",
      items: [
        { label: "Inspections", to: "/inspections", icon: IconCalendarStats },
        { label: "Maintenance Logs", to: "/maintenance", icon: IconTool }
      ]
    },
    {
      label: "Compliance",
      items: hasRole(["ADMIN", "INSPECTOR"]) ? [{ label: "Reports", to: "/reports", icon: IconChartBar }] : []
    },
    {
      label: "Administration",
      items: isAdmin() ? [{ label: "User Management", to: "/admin/users", icon: IconUsers }] : []
    }
  ].filter((section) => section.items.length > 0);

  const currentItem = navSections.flatMap((section) => section.items).find((item) => location.pathname === item.to);

  return (
    <AppShell
      className="enterprise-shell"
      header={{ height: 56 }}
      navbar={{ width: collapsed ? 72 : 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding={0}
    >
      <AppShell.Header className="app-header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <ThemeIcon className="brand-mark" size={36} radius="sm">
              <IconShieldCheck size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="sm">
                TZW Fire Safety
              </Text>
              <Text size="xs" c="dimmed">
                Operations / {currentItem?.label || "Dashboard"}
              </Text>
            </div>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Tooltip label="No new notifications">
              <Indicator label="0" size={16} disabled={false}>
                <ActionIcon variant="subtle" color="navy" aria-label="Notifications">
                  <IconBell size={18} />
                </ActionIcon>
              </Indicator>
            </Tooltip>
            <Badge variant="light" color={isAdmin() ? "blue" : hasRole("INSPECTOR") ? "teal" : "gray"}>
              {user?.role || "USER"}
            </Badge>
            <Avatar color="blue" radius="xl" size={34}>
              {initials}
            </Avatar>
            {!collapsed ? (
              <div style={{ minWidth: 112 }}>
                <Text size="sm" fw={700} lineClamp={1}>
                  {displayName}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {user?.email}
                </Text>
              </div>
            ) : null}
            <Tooltip label="Sign out">
              <ActionIcon variant="light" color="navy" aria-label="Logout" onClick={logout}>
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack h="100%" gap="sm">
          <Group justify={collapsed ? "center" : "space-between"} px={collapsed ? 0 : "xs"} pt={4}>
            {!collapsed ? (
              <div>
                <Text fw={800} size="xs" c="white">
                  COMMAND CENTER
                </Text>
                <Text size="xs" c="rgba(220, 231, 247, 0.62)">
                  Fire compliance suite
                </Text>
              </div>
            ) : null}
            <ActionIcon variant="subtle" color="gray" onClick={toggleCollapsed} aria-label="Collapse navigation">
              {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
            </ActionIcon>
          </Group>

          <Divider color="rgba(255,255,255,0.12)" />

          <ScrollArea flex={1} type="never">
            {navSections.map((section) => (
              <div key={section.label}>
                {!collapsed ? <Text className="nav-section-label">{section.label}</Text> : null}
                <Stack gap={4}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    const link = (
                      <NavLink
                        active={active}
                        component={Link}
                        to={item.to}
                        label={collapsed ? undefined : item.label}
                        leftSection={<Icon size={18} />}
                        onClick={close}
                      />
                    );

                    return collapsed ? (
                      <Tooltip key={item.to} label={item.label} position="right">
                        {link}
                      </Tooltip>
                    ) : (
                      <div key={item.to}>{link}</div>
                    );
                  })}
                </Stack>
              </div>
            ))}
          </ScrollArea>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="var(--enterprise-surface)">
        <div className="page-container">
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};

export default AppLayout;
