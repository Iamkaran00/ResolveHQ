// src/components/Footer.jsx

import { useMantineColorScheme, useComputedColorScheme, Group, Text } from "@mantine/core";
import { IconTicket } from "@tabler/icons-react";

function Footer() {
    const computedScheme = useComputedColorScheme("light");
    const isDark = computedScheme === "dark";

    return (
        <footer
            style={{
                borderTop: `1px solid ${isDark ? "#2A2D34" : "#E7E5E0"}`,
                background: isDark ? "#0F1115" : "#FAFAF9",
                padding: "20px 32px",
            }}
        >
            <Group justify="space-between" wrap="wrap" gap={8}>
                <Group gap={8}>
                    <div
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            background: "#5B6B8C",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <IconTicket size={11} color="white" />
                    </div>
                    <Text size="xs" fw={600} c={isDark ? "#8A8F99" : "#6B7280"}>
                        ResolvHQ
                    </Text>
                </Group>
                <Text size="xs" c="dimmed">
                    © {new Date().getFullYear()} ResolvHQ · one shared queue, no dropped tickets
                </Text>
            </Group>
        </footer>
    );
}

export default Footer;