// src/components/PublicFooter.jsx

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Group, Stack, Text, Divider, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";

export default function PublicFooter() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";
    const navigate = useNavigate();

    const footerRef = useRef(null);
    const textRef = useRef(null);

    const T = {
        surface: isDark ? "#101014" : "#F7F7F4",
        surfaceDeep: isDark ? "rgba(5,5,5,0.7)" : "rgba(247,247,244,0.7)",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "rgba(255,255,255,0.05)" : "#E6E4DD",
        pillBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    };

    useEffect(() => {
        let animationFrameId;

        const handleScroll = () => {
            if (!footerRef.current || !textRef.current) return;

            const rect = footerRef.current.getBoundingClientRect();

            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const distanceToBottom = window.innerHeight - rect.bottom;
                const yOffset = distanceToBottom * 0.3;
                textRef.current.style.transform = `translate(-50%, ${yOffset}px)`;
            }
        };

        const onScroll = () => {
            animationFrameId = requestAnimationFrame(handleScroll);
        };

        window.addEventListener("scroll", onScroll);
        handleScroll();

        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <Box
            ref={footerRef}
            style={{
                position: "relative",
                background: T.surface,
                borderTop: `1px solid ${T.line}`,
                overflow: "hidden",
                paddingTop: 80,
            }}
        >
            {/* glow */}
            <Box
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 800,
                    height: 400,
                    background: "rgba(99,102,241,0.10)",
                    borderRadius: "50%",
                    filter: "blur(120px)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* content */}
            <Box style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto" }} px={{ base: "md", sm: "xl" }} pb={96}>
                <Stack gap={6} maw={340}>
                    <Text
                        fw={800}
                        size="xl"
                        c={T.ink}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    >
                        Resolve
                        <Text span fw={800} size="xl" variant="gradient" gradient={{ from: "cyan.4", to: "indigo.5" }}>
                            HQ
                        </Text>
                    </Text>
                    <Text size="sm" c={T.inkMuted} fw={500}>
                        A support ticket queue that keeps ownership, replies, and history in one place.
                    </Text>

                    <Group gap={12} mt={12}>
                        <ActionIcon
                            component="a"
                            href="https://github.com/Iamkaran00/ResolveHQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                            variant="default"
                            radius="xl"
                            size={44}
                            style={{
                                background: T.pillBg,
                                border: `1px solid ${T.line}`,
                                color: T.inkMuted,
                                transition: "all .3s ease",
                            }}
                            styles={{
                                root: {
                                    "&:hover": {
                                        borderColor: "rgba(99,102,241,0.5)",
                                        boxShadow: "0 0 20px rgba(99,102,241,0.2)",
                                        color: T.ink,
                                        transform: "translateY(-2px)",
                                    },
                                },
                            }}
                        >
                            <IconBrandGithub size={18} />
                        </ActionIcon>
                    </Group>
                </Stack>
            </Box>

            {/* watermark */}
            <Box
                ref={textRef}
                style={{
                    position: "absolute",
                    bottom: 60,
                    left: "50%",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 0,
                    transform: "translate(-50%, 300px)",
                }}
            >
                <Text
                    fw={800}
                    style={{
                        fontSize: "16vw",
                        lineHeight: 0.8,
                        letterSpacing: "-0.03em",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        background: isDark
                            ? "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)"
                            : "linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    ResolveHQ
                </Text>
            </Box>

            {/* bottom bar */}
            <Box
                style={{
                    position: "relative",
                    zIndex: 20,
                    borderTop: `1px solid ${T.line}`,
                    background: T.surfaceDeep,
                    backdropFilter: "blur(20px)",
                }}
            >
                <Group
                    justify="space-between"
                    wrap="wrap"
                    gap={12}
                    py={20}
                    px={{ base: "md", sm: "xl" }}
                    style={{ maxWidth: 1200, margin: "0 auto" }}
                >
                    <Text size="xs" c={T.inkFaint}>
                        © {new Date().getFullYear()} ResolveHQ. All rights reserved.
                    </Text>

                    <Group gap={24} align="center">
                        <Group
                            gap={10}
                            px={14}
                            py={6}
                            style={{
                                borderRadius: 999,
                                background: T.pillBg,
                                border: `1px solid ${T.line}`,
                            }}
                        >
                            <Box pos="relative" style={{ width: 8, height: 8 }}>
                                <Box
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "50%",
                                        background: "#34d399",
                                        opacity: 0.75,
                                        animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                                    }}
                                />
                                <Box
                                    style={{
                                        position: "relative",
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: "#10b981",
                                    }}
                                />
                            </Box>
                            <Text size={11} c={T.inkMuted} tt="uppercase" ff="monospace" style={{ letterSpacing: "0.05em" }}>
                                All systems operational
                            </Text>
                        </Group>

                        <Text size="xs" c={T.inkFaint} visibleFrom="sm">
                            Built for support teams.
                        </Text>
                    </Group>
                </Group>
            </Box>

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </Box>
    );
}