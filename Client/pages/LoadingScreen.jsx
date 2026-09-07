// src/components/LoadingScreen.jsx
import { useEffect, useState } from "react";
import { Box, Stack, Text, useMantineColorScheme } from "@mantine/core";
import {
    IconInbox, IconUserCheck, IconClockPause, IconCircleCheck, IconArchive,
} from "@tabler/icons-react";

const STAGES = [
    { key: "new", label: "New", icon: IconInbox },
    { key: "open", label: "Open", icon: IconUserCheck },
    { key: "pending", label: "Pending", icon: IconClockPause },
    { key: "resolved", label: "Resolved", icon: IconCircleCheck },
    { key: "closed", label: "Closed", icon: IconArchive },
];

export default function LoadingScreen() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";
    const [idx, setIdx] = useState(0);

    // Same status→color mapping used on Dashboard/TicketDetail, so this
    // loader speaks the same visual language as the rest of the app.
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3",
        mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    };
    const STATUS_COLOR = {
        new: T.inkFaint, open: T.accent, pending: "#8A6D1D", resolved: "#2F5F3E", closed: "#B3401D",
    };

    useEffect(() => {
        const t = setInterval(() => setIdx((i) => (i + 1) % STAGES.length), 900);
        return () => clearInterval(t);
    }, []);

    const stage = STAGES[idx];
    const Icon = stage.icon;
    const color = STATUS_COLOR[stage.key];

    return (
        <Box
            style={{
                position: "fixed", inset: 0, background: T.page, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
        >
            <style>{`
                @keyframes rhqFadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes rhqSweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
                @keyframes rhqPop { 0% { transform: scale(0.6); opacity:0; } 60% { transform: scale(1.08); opacity:1; } 100% { transform: scale(1); opacity:1; } }
                @keyframes rhqDot { 0%, 100% { opacity:0.25; } 50% { opacity:1; } }
                @keyframes rhqBarFill { 0% { width: 0%; } 100% { width: 100%; } }
            `}</style>

            <Stack align="center" gap={22} style={{ animation: "rhqFadeIn .3s ease" }}>
                {/* Ticket stub shape: rectangle with circular notches on both edges + dashed perforation */}
                <Box
                    style={{
                        position: "relative",
                        width: 220,
                        height: 110,
                        background: T.surface,
                        border: `1px solid ${T.line}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(0,0,0,0.06)",
                    }}
                >
                    {/* notches */}
                    <Box style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: "50%", background: T.page, border: `1px solid ${T.line}` }} />
                    <Box style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: "50%", background: T.page, border: `1px solid ${T.line}` }} />
                    {/* perforation line */}
                    <Box
                        style={{
                            position: "absolute", left: 66, top: 0, bottom: 0, width: 0,
                            borderLeft: `2px dashed ${T.line}`,
                        }}
                    />
                    {/* scanning sweep light */}
                    <Box
                        style={{
                            position: "absolute", top: 0, bottom: 0, width: "40%",
                            background: isDark
                                ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
                                : "linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)",
                            animation: "rhqSweep 1.8s ease-in-out infinite",
                        }}
                    />

                    {/* left stub: ticket id */}
                    <Box style={{ position: "absolute", left: 0, top: 0, width: 66, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text size="10px" fw={700} c={T.inkFaint} style={{ fontFamily: T.mono, writingMode: "vertical-rl", letterSpacing: 1 }}>
                            #4471
                        </Text>
                    </Box>

                    {/* right side: cycling stage */}
                    <Box style={{ position: "absolute", left: 66, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Box key={stage.key} style={{ animation: "rhqPop .35s ease" }}>
                            <Icon size={26} color={color} />
                        </Box>
                        <Text
                            key={stage.key + "-label"}
                            size="xs"
                            fw={700}
                            style={{ color, fontFamily: T.mono, letterSpacing: 0.5, animation: "rhqPop .35s ease" }}
                        >
                            {stage.label.toUpperCase()}
                        </Text>
                    </Box>
                </Box>

                {/* progress bar under the ticket */}
                <Box style={{ width: 180, height: 3, borderRadius: 2, background: T.line, overflow: "hidden" }}>
                    <Box style={{ height: "100%", background: T.accent, animation: "rhqBarFill 3.6s linear infinite" }} />
                </Box>

                <Stack align="center" gap={4}>
                    <Text size="xs" fw={700} c={T.inkMuted} style={{ fontFamily: T.mono, letterSpacing: 1.5 }}>
                        RESOLVEHQ
                    </Text>
                    <Text size="xs" c={T.inkFaint}>Loading your workspace…</Text>
                </Stack>
            </Stack>
        </Box>
    );
}