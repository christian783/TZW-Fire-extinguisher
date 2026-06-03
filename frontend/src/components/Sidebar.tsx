import { NavLink, Stack } from "@mantine/core";
import { IconChecklist, IconDashboard, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type SidebarProps = {
  onClose?: () => void;
};

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const { isAdmin, hasRole } = useAuth();
  const navItems = [
    { label: "Dashboard", to: "/dashboard", icon: IconDashboard },
    { label: "Extinguishers", to: "/extinguishers", icon: IconShieldCheck },
    { label: "Inspections", to: "/inspections", icon: IconChecklist },
    { label: "Maintenance", to: "/maintenance", icon: IconChecklist },
    ...(hasRole(["ADMIN", "INSPECTOR"]) ? [{ label: "Reports", to: "/reports", icon: IconChecklist }] : []),
    ...(isAdmin() ? [{ label: "Users", to: "/admin/users", icon: IconUsers }] : [])
  ];

  return (
    <Stack gap={4}>
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            active={location.pathname === item.to}
            label={item.label}
            leftSection={<Icon size={18} />}
            onClick={onClose}
          />
        );
      })}
    </Stack>
  );
};

export default Sidebar;
