// src/pages/NotFound.jsx

import { useNavigate } from "react-router-dom";
import { Text, Button, Box, Stack, useMantineColorScheme } from "@mantine/core";
import { IconArrowLeft, IconLifebuoy } from "@tabler/icons-react";

export default function NotFound() {
    const navigate = useNavigate();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    // Same monochrome system as TicketDetail: black/white ink and accent,
    // with the "urgent" terracotta reserved for things that need attention —
    // a missing page counts.
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#6B6F76" : "#9CA0A6",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3",
        urgent: "#B3401D",
        mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    };

    
    const TicketIllustration = () => (
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left half */}
            <g transform="translate(-6 -8) rotate(-4 70 108)">
                <path
                    d="M20 46 H92 L100 60 L92 74 L100 88 L92 102 L100 116 L92 130 L100 144 L92 158 L100 172 L20 172 Z"
                    fill={T.surface}
                    stroke={T.line}
                    strokeWidth="1.5"
                />
                <circle cx="20" cy="109" r="7" fill={T.page} stroke={T.line} strokeWidth="1.5" />
                <rect x="34" y="66" width="42" height="6" rx="3" fill={T.line} />
                <rect x="34" y="82" width="30" height="6" rx="3" fill={T.line} />
                <rect x="34" y="146" width="34" height="6" rx="3" fill={T.urgent} opacity="0.8" />
            </g>
            {/* Right half */}
            <g transform="translate(6 10) rotate(5 150 112)">
                <path
                    d="M200 50 H128 L120 64 L128 78 L120 92 L128 106 L120 120 L128 134 L120 148 L128 162 L120 176 L200 176 Z"
                    fill={T.surface}
                    stroke={T.line}
                    strokeWidth="1.5"
                />
                <circle cx="200" cy="113" r="7" fill={T.page} stroke={T.line} strokeWidth="1.5" />
                <rect x="140" y="70" width="46" height="6" rx="3" fill={T.line} />
                <rect x="140" y="86" width="28" height="6" rx="3" fill={T.line} />
                <rect x="140" y="150" width="24" height="6" rx="3" fill={T.line} />
            </g>
        </svg>
    );

    return (
        <Box style={{ background: T.page, minHeight: "100vh" }}>
            <Box
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                p="xl"
            >
                <Stack align="center" gap={4} style={{ textAlign: "center" }}>
                    <TicketIllustration />

                    <Text
                        mt="md"
                        style={{
                            fontFamily: T.mono,
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: 1,
                            color: T.urgent,
                        }}
                    >
                        TICKET #404 — NOT FOUND
                    </Text>

                    <Text size="24px" fw={700} c={T.ink} mt={6}>
                        This one didn't make it to the queue
                    </Text>

                    <Text size="sm" c={T.inkMuted} maw={380} mt={6} style={{ lineHeight: 1.6 }}>
                        The ticket or page you're looking for has been closed, moved, or never existed.
                        Check the link, or head back to where you came from.
                    </Text>

                    <Button
                        mt="xl"
                        size="sm"
                        radius="sm"
                        color="dark"
                        leftSection={<IconArrowLeft size={14} />}
                        onClick={() => navigate(-1)}
                    >
                        Back to queue
                    </Button>

                    <Button
                        mt="xs"
                        size="sm"
                        radius="sm"
                        variant="subtle"
                        color="gray"
                        leftSection={<IconLifebuoy size={14} />}
                        onClick={() => navigate("/")}
                    >
                        Go to homepage
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}