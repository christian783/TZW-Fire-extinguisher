import { Button, Group, Text, ThemeIcon } from "@mantine/core";
import { IconLogout, IconMenu2, IconShieldCheck } from "@tabler/icons-react";

import { useAuth } from "../context/AuthContext";

type NavbarProps = {
  onMenuClick?: () => void;
};

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuth();
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Signed in";

  return (
    <Group h={64} px="md" justify="space-between">
      <Group>
        {onMenuClick ? (
          <Button variant="subtle" px="xs" onClick={onMenuClick} aria-label="Open navigation">
            <IconMenu2 size={18} />
          </Button>
        ) : null}
        <ThemeIcon radius="md">
          <IconShieldCheck size={18} />
        </ThemeIcon>
        <div>
          <Text fw={700}>TZW Fire Safety</Text>
          <Text size="xs" c="dimmed">
            Fire safety microservices
          </Text>
        </div>
      </Group>
      <Group>
        <div style={{ textAlign: "right" }}>
          <Text size="sm" fw={600}>
            {displayName}
          </Text>
          <Text size="xs" c="dimmed">
            {user?.role}
          </Text>
        </div>
        <Button variant="light" leftSection={<IconLogout size={16} />} onClick={logout}>
          Logout
        </Button>
      </Group>
    </Group>
  );
};

export default Navbar;
