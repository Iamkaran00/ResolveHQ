// src/components/PublicFooter.jsx

import { Box, Group, Text, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";

export default function PublicFooter() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    const T = {
        surface: isDark ? "#101014" : "#F7F7F4",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "rgba(255,255,255,0.05)" : "#E6E4DD",
        pillBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    };

    return (
        <Box
            style={{
                background: T.surface,
                borderTop: `1px solid ${T.line}`,
            }}
            py={16}
            px={{ base: "md", sm: "xl" }}
        >
            <Group
                justify="space-between"
                wrap="wrap"
                gap={10}
                style={{ maxWidth: 1200, margin: "0 auto" }}
            >
                <Group gap={10}>
                    <Text fw={700} size="sm" c={T.ink}>
                        Resolve
                        <Text span fw={700} size="sm" variant="gradient" gradient={{ from: "cyan.4", to: "indigo.5" }}>
                            HQ
                        </Text>
                    </Text>
                    <Text size="xs" c={T.inkFaint}>
                        © {new Date().getFullYear()}. All rights reserved.
                    </Text>
                </Group>

                <Group gap={14} align="center">
                    <Text size="xs" c={T.inkFaint}>
                        Built with <Text span c="indigo.5">❤️</Text> for support teams.
                    </Text>

                    <ActionIcon
                        component="a"
                        href="https://github.com/Iamkaran00/ResolveHQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        variant="default"
                        radius="xl"
                        size={32}
                        style={{
                            background: T.pillBg,
                            border: `1px solid ${T.line}`,
                            color: T.inkMuted,
                        }}
                    >
                        <IconBrandGithub size={15} />
                    </ActionIcon>
                </Group>
            </Group>
        </Box>
    );
}