// src/components/Navbar.jsx

import { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useMantineColorScheme, useComputedColorScheme, Group, Text, Badge, Menu, Avatar, ActionIcon, UnstyledButton } from "@mantine/core";
import { IconTicket, IconLayoutDashboard, IconBell, IconSun, IconMoon, IconLogout, IconChevronDown } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { logoutUser } from "../redux/operations/authOperations";
import { fetchAlerts } from "../redux/operations/slaOperations";

function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { count } = useSelector((state) => state.alert);

    const { setColorScheme } = useMantineColorScheme();
    const computedScheme = useComputedColorScheme("light");
    const isDark = computedScheme === "dark";

    useEffect(() => {
        dispatch(fetchAlerts());
        const interval = setInterval(() => dispatch(fetchAlerts()), 60000); // matches server SLA sweep cadence
        return () => clearInterval(interval);
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        notifications.show({ title: "Signed out", message: "See you next time.", color: "gray" });
        navigate("/login");
    };

    const toggleTheme = () => setColorScheme(isDark ? "light" : "dark");

    const links = [
        { to: "/tickets", label: "Tickets", icon: IconTicket },
        ...(user?.role === "supervisor"
            ? [{ to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard }]
            : []),
        { to: "/alerts", label: "Alerts", icon: IconBell, badge: count },
    ];

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: isDark ? "#15171C" : "#FAFAF9",
                borderBottom: `1px solid ${isDark ? "#2A2D34" : "#E7E5E0"}`,
                padding: "0 32px",
                transition: "background 0.25s ease, border-color 0.25s ease",
            }}
        >
            <Group justify="space-between" h={56}>
                <Group gap={32}>
                    <Group gap={8}>
                        <div
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: "#5B6B8C",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <IconTicket size={13} color="white" />
                        </div>
                        <Text fw={700} size="sm" c={isDark ? "#F4F3F0" : "#0F1115"}>
                            ResolveHQ
                        </Text>
                    </Group>

                    <Group gap={4}>
                        {links.map((link) => {
                            const active = location.pathname.startsWith(link.to);
                            const Icon = link.icon;
                            return (
                                <UnstyledButton
                                    key={link.to}
                                    component={NavLink}
                                    to={link.to}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: active ? (isDark ? "#F4F3F0" : "#0F1115") : (isDark ? "#8A8F99" : "#6B7280"),
                                        background: active ? (isDark ? "#22252C" : "#EFEEEA") : "transparent",
                                        transition: "background 0.15s ease, color 0.15s ease",
                                    }}
                                >
                                    <Icon size={15} />
                                    {link.label}
                                    {link.badge > 0 && (
                                        <Badge size="xs" circle color="#9E2B3E" style={{ fontVariantNumeric: "tabular-nums" }}>
                                            {link.badge}
                                        </Badge>
                                    )}
                                </UnstyledButton>
                            );
                        })}
                    </Group>
                </Group>

                <Group gap={12}>
                    {/* theme toggle — the one deliberate motion moment in the chrome */}
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        radius="xl"
                        size={32}
                        onClick={toggleTheme}
                        aria-label="Toggle color scheme"
                    >
                        <motion.div
                            key={computedScheme}
                            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            style={{ display: "flex" }}
                        >
                            {isDark ? <IconMoon size={16} /> : <IconSun size={16} />}
                        </motion.div>
                    </ActionIcon>

                    <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                            <UnstyledButton style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar size={28} radius="xl" color="dark">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <div style={{ textAlign: "left" }}>
                                    <Text size="xs" fw={600} c={isDark ? "#F4F3F0" : "#0F1115"} lh={1.1}>
                                        {user?.name}
                                    </Text>
                                    <Text size="10px" c="dimmed" tt="capitalize" lh={1.1}>
                                        {user?.role}
                                    </Text>
                                </div>
                                <IconChevronDown size={14} color={isDark ? "#8A8F99" : "#6B7280"} />
                            </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                                Log out
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Group>
        </nav>
    );
}

export default Navbar;