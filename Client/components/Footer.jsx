// src/components/Footer.jsx

import { useComputedColorScheme, Group, Text, Anchor } from "@mantine/core";
import { IconHeart } from "@tabler/icons-react";

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
                <Group gap={6}>
                    <Text size="xs" c="dimmed">
                        Built with
                    </Text>
                    <IconHeart size={12} color="#E06C75" style={{ display: "inline", verticalAlign: "middle" }} />
                    <Text size="xs" c="dimmed">
                        by Karan Sahu
                    </Text>
                </Group>
                
                <Anchor
                    href="https://github.com/your-username"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    c={isDark ? "#8A8F99" : "#6B7280"}
                    style={{ textDecoration: "none", fontWeight: 500 }}
                >
                    GitHub
                </Anchor>
            </Group>
        </footer>
    );
}

export default Footer;