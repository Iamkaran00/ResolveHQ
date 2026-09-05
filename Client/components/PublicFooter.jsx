// src/components/PublicFooter.jsx

import { useNavigate } from "react-router-dom";
import { Box, Group, Stack, Text, SimpleGrid, Divider, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconBrandGithub, IconBrandX, IconBrandLinkedin } from "@tabler/icons-react";

const COLUMNS = [
    { title: "Product", links: [["Features", "#features"], ["Lifecycle", "#lifecycle"], ["Pricing", "/pricing"], ["Changelog", "/changelog"]] },
    { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Careers", "/careers"]] },
    { title: "Resources", links: [["Docs", "/docs"], ["API reference", "/api"], ["Support", "/support"]] },
    { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export default function PublicFooter() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";
    const navigate = useNavigate();

    const T = {
        surface: isDark ? "#101214" : "#F7F7F4",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "#262A2E" : "#E6E4DD",
    };

    const go = (href) => (href.startsWith("#") ? document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }) : navigate(href));

    return (
        <Box style={{ background: T.surface, borderTop: `1px solid ${T.line}` }} pt={56} pb={28} px={{ base: "md", sm: "xl" }}>
            <Box style={{ maxWidth: 1200, margin: "0 auto" }}>
                <SimpleGrid cols={{ base: 2, sm: 5 }} spacing={32} mb={40}>
                    <Stack gap={6}>
                        <Text fw={800} c={T.ink} size="lg">ResolveHQ</Text>
                        <Text size="xs" c={T.inkMuted} maw={200}>
                            A support ticket queue that keeps ownership, replies, and history in one place.
                        </Text>
                        <Group gap={8} mt={8}>
                            <ActionIcon variant="subtle" href="https://github.com/Iamkaran00/ResolveHQ" color="gray" radius="sm" aria-label="GitHub"><IconBrandGithub size={16} /></ActionIcon>
                            
                        </Group>
                    </Stack>

                    {COLUMNS.map((col) => (
                        <Stack gap={10} key={col.title}>
                            <Text size="xs" fw={700} c={T.inkFaint}>{col.title}</Text>
                            {col.links.map(([label, href]) => (
                                <Text key={label} size="sm" c={T.inkMuted} style={{ cursor: "pointer" }} onClick={() => go(href)}>
                                    {label}
                                </Text>
                            ))}
                        </Stack>
                    ))}
                </SimpleGrid>

                <Divider color={T.line} mb={20} />

                <Group justify="space-between" wrap="wrap" gap={10}>
                    <Text size="xs" c={T.inkFaint}>© {new Date().getFullYear()} ResolveHQ. All rights reserved.</Text>
                    <Text size="xs" c={T.inkFaint}>Built for support teams.</Text>
                </Group>
            </Box>
        </Box>
    );
}