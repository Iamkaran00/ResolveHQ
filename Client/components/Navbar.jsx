// src/components/Navbar.jsx

import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
    useMantineColorScheme, useComputedColorScheme,
    Group, Text, Badge, Menu, Avatar, ActionIcon, UnstyledButton,
    Button, Burger, Drawer, Stack, Divider,
} from "@mantine/core";
import { IconTicket, IconLayoutDashboard, IconBell, IconSun, IconMoon, IconLogout, IconChevronDown } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { logoutUser } from "../redux/operations/authOperations";
import { fetchAlerts } from "../redux/operations/slaOperations";

const PUBLIC_LINKS = [
    { label: "Product", href: "#features" },
    { label: "Lifecycle", href: "#lifecycle" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
];

function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { count } = useSelector((state) => state.alert || {});

    const { setColorScheme } = useMantineColorScheme();
    const computedScheme = useComputedColorScheme("light");
    const isDark = computedScheme === "dark";

    const [drawerOpen, setDrawerOpen] = useState(false);

    // Design tokens — same palette used across the app, so the chrome
    // never looks like a different product from the page it's wrapping.
    const T = {
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3",
        accentTint: isDark ? "rgba(244,244,243,0.12)" : "rgba(14,15,17,0.06)",
        urgent: "#B3401D",
    };

    useEffect(() => {
        if (!user) return;
        dispatch(fetchAlerts());
        const interval = setInterval(() => dispatch(fetchAlerts()), 60000); // matches server SLA sweep cadence
        return () => clearInterval(interval);
    }, [dispatch, user]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        notifications.show({ title: "Signed out", message: "See you next time.", color: "gray" });
        navigate("/");
    };

    const toggleTheme = () => setColorScheme(isDark ? "light" : "dark");

    const appLinks = [
        { to: "/tickets", label: "Tickets", icon: IconTicket },
        ...(user?.role === "supervisor" ? [{ to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard }] : []),
        { to: "/alerts", label: "Alerts", icon: IconBell, badge: count },
    ];

    const goPublic = (href) => {
        setDrawerOpen(false);
        if (href.startsWith("#")) document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
        else navigate(href);
    };

    const ThemeToggle = (
        <ActionIcon variant="subtle" color="gray" radius="xl" size={32} onClick={toggleTheme} aria-label="Toggle color scheme">
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
    );

    return (
        <>
            <nav
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    background: T.surface,
                    borderBottom: `1px solid ${T.line}`,
                    padding: "0 24px",
                    transition: "background 0.25s ease, border-color 0.25s ease",
                    fontFamily: "inherit",
                }}
            >
                <Group justify="space-between" h={58} style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <Group gap={36}>
                        <UnstyledButton
                            onClick={() => navigate(user ? "/tickets" : "/")}
                            style={{ display: "flex", alignItems: "center", gap: 9 }}
                        >
                            <div
                                style={{
                                    width: 24, height: 24, borderRadius: 7,
                                    background: T.accent,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <IconTicket size={14} color={T.accentInk} />
                            </div>
                            <Text fw={700} size="sm" c={T.ink}>ResolveHQ</Text>
                        </UnstyledButton>

                        {/* App nav (logged in) */}
                        {user && (
                            <Group gap={4} visibleFrom="sm">
                                {appLinks.map((link) => {
                                    const active = location.pathname.startsWith(link.to);
                                    const Icon = link.icon;
                                    return (
                                        <UnstyledButton
                                            key={link.to}
                                            component={NavLink}
                                            to={link.to}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                padding: "6px 12px", borderRadius: 6,
                                                fontSize: 13, fontWeight: 600,
                                                color: active ? T.accent : T.inkMuted,
                                                background: active ? T.accentTint : "transparent",
                                                transition: "background 0.15s ease, color 0.15s ease",
                                            }}
                                        >
                                            <Icon size={15} />
                                            {link.label}
                                            {link.badge > 0 && (
                                                <Badge size="xs" circle color="red" bg={T.urgent} style={{ fontVariantNumeric: "tabular-nums" }}>
                                                    {link.badge}
                                                </Badge>
                                            )}
                                        </UnstyledButton>
                                    );
                                })}
                            </Group>
                        )}

                        {/* Public nav (logged out) */}
                        {!user && (
                            <Group gap={28} visibleFrom="sm">
                                {PUBLIC_LINKS.map((l) => (
                                    <Text
                                        key={l.label}
                                        size="sm"
                                        fw={500}
                                        c={T.inkMuted}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => goPublic(l.href)}
                                    >
                                        {l.label}
                                    </Text>
                                ))}
                            </Group>
                        )}
                    </Group>

                    <Group gap={12}>
                        {ThemeToggle}

                        {user ? (
                            <Menu shadow="md" width={200} position="bottom-end">
                                <Menu.Target>
                                    <UnstyledButton style={{ display: "flex", alignItems: "center", gap: 8 }} visibleFrom="sm">
                                        <Avatar size={28} radius="xl" color="dark">
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <div style={{ textAlign: "left" }}>
                                            <Text size="xs" fw={600} c={T.ink} lh={1.1}>{user?.name}</Text>
                                            <Text size="10px" c={T.inkFaint} tt="capitalize" lh={1.1}>{user?.role}</Text>
                                        </div>
                                        <IconChevronDown size={14} color={T.inkMuted} />
                                    </UnstyledButton>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                                        Log out
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        ) : (
                            <Group gap={8} visibleFrom="sm">
                                <Button size="xs" radius="sm" variant="subtle" color="gray" onClick={() => navigate("/login")}>
                                    Sign in
                                </Button>
                                <Button size="xs" radius="sm" color="dark" onClick={() => navigate("/register")}>
                                    Get started
                                </Button>
                            </Group>
                        )}

                        <Burger opened={drawerOpen} onClick={() => setDrawerOpen((o) => !o)} size="sm" hiddenFrom="sm" />
                    </Group>
                </Group>
            </nav>

            <Drawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} position="right" size="xs" title="Menu">
                <Stack gap="md">
                    {user
                        ? appLinks.map((l) => (
                              <UnstyledButton key={l.to} component={NavLink} to={l.to} onClick={() => setDrawerOpen(false)} fw={500}>
                                  {l.label}{l.badge > 0 ? ` (${l.badge})` : ""}
                              </UnstyledButton>
                          ))
                        : PUBLIC_LINKS.map((l) => (
                              <Text key={l.label} fw={500} style={{ cursor: "pointer" }} onClick={() => goPublic(l.href)}>
                                  {l.label}
                              </Text>
                          ))}
                    <Divider />
                    {user ? (
                        <Button fullWidth color="red" variant="light" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                            Log out
                        </Button>
                    ) : (
                        <>
                            <Button fullWidth variant="default" onClick={() => goPublic("/login")}>Sign in</Button>
                            <Button fullWidth color="dark" onClick={() => goPublic("/register")}>Get started</Button>
                        </>
                    )}
                </Stack>
            </Drawer>
        </>
    );
}

export default Navbar;