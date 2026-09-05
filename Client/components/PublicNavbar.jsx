// src/components/PublicNavbar.jsx

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Group, Text, Button, ActionIcon, Burger, Drawer, Stack, Divider, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

const LINKS = [
    { label: "Product", href: "#lifecycle" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
];

export default function PublicNavbar() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth?.user);

    const [scrolled, setScrolled] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const T = {
        surface: isDark ? "rgba(23,25,28,0.85)" : "rgba(255,255,255,0.85)",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: "#2C4E7C",
    };

    const go = (href) => {
        setDrawerOpen(false);
        if (href.startsWith("#")) {
            document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate(href);
        }
    };

    return (
        <>
            <Box
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    background: T.surface,
                    backdropFilter: "blur(10px)",
                    borderBottom: `1px solid ${scrolled ? T.line : "transparent"}`,
                    transition: "border-color .2s ease",
                }}
            >
                <Group justify="space-between" px={{ base: "md", sm: "xl" }} h={60} style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <Text fw={800} c={T.ink} size="lg" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                        Deskflow
                    </Text>

                    <Group gap={28} visibleFrom="sm">
                        {LINKS.map((l) => (
                            <Text
                                key={l.label}
                                size="sm"
                                fw={500}
                                c={T.inkMuted}
                                style={{ cursor: "pointer" }}
                                onClick={() => go(l.href)}
                            >
                                {l.label}
                            </Text>
                        ))}
                    </Group>

                    <Group gap={10}>
                        <ActionIcon variant="subtle" color="gray" radius="sm" onClick={() => toggleColorScheme()} aria-label="Toggle theme">
                            {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
                        </ActionIcon>

                        <Group gap={8} visibleFrom="sm">
                            {user ? (
                                <Button size="xs" radius="sm" color="blue" onClick={() => navigate("/dashboard")}>
                                    Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button size="xs" radius="sm" variant="subtle" color="gray" onClick={() => navigate("/login")}>
                                        Sign in
                                    </Button>
                                    <Button size="xs" radius="sm" color="blue" onClick={() => navigate("/signup")}>
                                        Get started
                                    </Button>
                                </>
                            )}
                        </Group>

                        <Burger opened={drawerOpen} onClick={() => setDrawerOpen((o) => !o)} size="sm" hiddenFrom="sm" />
                    </Group>
                </Group>
            </Box>

            <Drawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} position="right" size="xs" title="Menu">
                <Stack gap="md">
                    {LINKS.map((l) => (
                        <Text key={l.label} fw={500} onClick={() => go(l.href)} style={{ cursor: "pointer" }}>
                            {l.label}
                        </Text>
                    ))}
                    <Divider />
                    {user ? (
                        <Button fullWidth color="blue" onClick={() => go("/dashboard")}>Dashboard</Button>
                    ) : (
                        <>
                            <Button fullWidth variant="default" onClick={() => go("/login")}>Sign in</Button>
                            <Button fullWidth color="blue" onClick={() => go("/signup")}>Get started</Button>
                        </>
                    )}
                </Stack>
            </Drawer>
        </>
    );
}