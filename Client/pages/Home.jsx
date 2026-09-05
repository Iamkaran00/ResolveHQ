// src/pages/HomePage.jsx

import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Text, Button, Group, Stack, SimpleGrid, useMantineColorScheme } from "@mantine/core";
import {
    IconInbox, IconUserCheck, IconClockPause, IconCircleCheck, IconArchive,
    IconMessageCircle, IconClockHour4, IconUsersGroup, IconHistory, IconArrowRight,
    IconTicket, IconHeadset, IconShieldCheck, IconFileText,
} from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import PublicFooter from "../components/PublicFooter";

const STAGES = [
    { key: "new", label: "New", title: "A ticket comes in", desc: "A customer reports an issue. It lands in the shared queue, visible to the whole team.", icon: IconInbox },
    { key: "open", label: "Open", title: "An agent takes it", desc: "Someone claims ownership. The response-time clock starts counting.", icon: IconUserCheck },
    { key: "pending", label: "Pending", title: "Waiting on the customer", desc: "The agent replies and the clock pauses until the customer responds.", icon: IconClockPause },
    { key: "resolved", label: "Resolved", title: "The issue is fixed", desc: "The fix ships and the customer is told it's done.", icon: IconCircleCheck },
    { key: "closed", label: "Closed", title: "Signed off and archived", desc: "A supervisor closes it. Every message and change stays on the record.", icon: IconArchive },
];

const FEATURES = [
    { icon: IconMessageCircle, title: "Replies and internal notes", desc: "Customer-facing replies and internal notes are kept visibly separate.", color: "accent" },
    { icon: IconClockHour4, title: "SLA timers", desc: "Each ticket carries a response-time target that counts down live.", color: "urgent" },
    { icon: IconUsersGroup, title: "Collaborators", desc: "Add teammates to a ticket without changing who owns it.", color: "note" },
    { icon: IconHistory, title: "Audit trail", desc: "Every status change and reassignment is logged in order.", color: "good" },
];

const ROLES = [
    { icon: IconTicket, title: "Agent", desc: "Owns tickets, moves them through the lifecycle, and can loop in collaborators." },
    { icon: IconShieldCheck, title: "Supervisor", desc: "Reassigns ownership, closes tickets, and sees the full audit trail across the team." },
];

// Same status colors used on the ticket page — carried over so the card
// travelling through the demo actually means what it looks like.
const STAGE_COLOR = (key, T) => ({ new: T.inkFaint, open: T.accent, pending: T.note, resolved: T.good, closed: T.urgent }[key]);

function useReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return [ref, visible];
}

// Drives the SVG path draw-in and the travelling ticket card as the user
// scrolls through the lifecycle section.
function useScrollProgress(ref) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vh = window.innerHeight;
            const p = (vh - rect.top) / (rect.height + vh);
            setProgress(Math.min(1, Math.max(0, p)));
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [ref]);
    return progress;
}

const STAGE_H = 300;
const PATH_W = 100;
const lerp = (a, b, t) => a + (b - a) * t;

export default function HomePage() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth?.user);

    // Accent is monochrome now — black on light, white on dark — instead of blue.
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3", // text/icon color that sits ON the accent
        urgent: "#B3401D",
        note: "#8A6D1D",
        good: "#2F5F3E",
        mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    };

    const [heroRef, heroVisible] = useReveal();
    const [rolesRef, rolesVisible] = useReveal();
    const [ctaRef, ctaVisible] = useReveal();
    const lifecycleRef = useRef(null);
    const progress = useScrollProgress(lifecycleRef);
    const pathRef = useRef(null);
    const [pathLen, setPathLen] = useState(0);

    const n = STAGES.length;
    const totalH = n * STAGE_H;
    const points = STAGES.map((_, i) => ({ x: i % 2 === 0 ? 22 : 78, y: i * STAGE_H + STAGE_H / 2 }));
    const d = points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const my = (prev.y + p.y) / 2;
        return `${acc} C ${prev.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`;
    }, "");

    useEffect(() => {
        if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
    }, []);

    const activeIndex = Math.min(n - 1, Math.floor(progress * n));

    // Where the travelling ticket card sits right now, interpolated between
    // the two stage points it's currently between.
    const floatIdx = Math.min(n - 1, progress * (n - 1));
    const i0 = Math.floor(floatIdx);
    const i1 = Math.min(n - 1, i0 + 1);
    const t = floatIdx - i0;
    const cardX = lerp(points[i0].x, points[i1].x, t);
    const cardY = lerp(points[i0].y, points[i1].y, t);
    const cardStageIdx = Math.round(floatIdx);
    const cardStage = STAGES[cardStageIdx];
    const cardColor = STAGE_COLOR(cardStage.key, T);

    return (
        <Box style={{ background: T.page, minHeight: "100vh" }}>
            <style>{`
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
                .reveal { opacity:0; }
                .reveal.in { animation: fadeUp .6s ease forwards; }
                .feature-card { transition: transform .18s ease, box-shadow .18s ease; }
                .feature-card:hover { transform: translateY(-3px); }
                .role-card { transition: transform .18s ease, border-color .18s ease; }
                .role-card:hover { transform: translateY(-3px); }
            `}</style>

            <Navbar />

            {/* ---------------- Hero ---------------- */}
            <Box
                ref={heroRef}
                className={`reveal ${heroVisible ? "in" : ""}`}
                pt={92}
                pb={64}
                px="md"
                style={{
                    backgroundImage: `radial-gradient(${T.line} 1px, transparent 1px)`,
                    backgroundSize: "22px 22px",
                    backgroundPosition: "center top",
                }}
            >
                <Stack gap={16} align="center" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
                    <Text size="xs" fw={700} c={T.accent} style={{ fontFamily: T.mono, letterSpacing: 1 }}>
                        SUPPORT TICKETING
                    </Text>
                    <Text fw={800} c={T.ink} style={{ fontSize: "clamp(30px, 4.5vw, 48px)", lineHeight: 1.15 }}>
                        One queue. A clear owner at every stage.
                    </Text>
                    <Text size="md" c={T.inkMuted} maw={480}>
                        Track a ticket from the moment it's reported to the moment it's closed,
                        with a full history nobody has to reconstruct later.
                    </Text>
                    <Group gap={12} mt={8}>
                        <Button size="md" radius="sm" color="dark" rightSection={<IconArrowRight size={16} />} onClick={() => navigate(user ? "/tickets" : "/register")}>
                            {user ? "Go to your queue" : "Get started free"}
                        </Button>
                        {!user && (
                            <Button size="md" radius="sm" variant="default" onClick={() => navigate("/login")}>
                                Sign in
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Box>

            {/* ---------------- Lifecycle: a ticket travels the path ---------------- */}
            <Box id="lifecycle" px="md" pb={40}>
                <Stack gap={4} align="center" mb={8}>
                    <Text size="xs" fw={700} c={T.inkMuted} style={{ fontFamily: T.mono, letterSpacing: 1 }}>THE LIFECYCLE</Text>
                    <Text fw={700} c={T.ink} size="26px">Follow one ticket end to end</Text>
                    <Text size="sm" c={T.inkFaint}>Scroll — the ticket below moves with you.</Text>
                </Stack>

                <Box ref={lifecycleRef} style={{ position: "relative", maxWidth: 900, margin: "0 auto", height: totalH }}>
                    <svg
                        viewBox={`0 0 ${PATH_W} ${totalH}`}
                        preserveAspectRatio="none"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                    >
                        <path d={d} fill="none" stroke={T.line} strokeWidth={1.5} />
                        <path
                            ref={pathRef}
                            d={d}
                            fill="none"
                            stroke={T.accent}
                            strokeWidth={1.5}
                            strokeDasharray={pathLen}
                            strokeDashoffset={pathLen * (1 - progress)}
                            style={{ transition: "stroke-dashoffset 80ms linear" }}
                        />
                    </svg>

                    {STAGES.map((stage, i) => {
                        const Icon = stage.icon;
                        const isActive = i <= activeIndex;
                        const leftDot = i % 2 === 0;
                        return (
                            <Box key={stage.key} style={{ position: "absolute", top: i * STAGE_H, height: STAGE_H, left: 0, right: 0 }}>
                                <Box
                                    style={{
                                        position: "absolute",
                                        left: `${leftDot ? 22 : 78}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: 44,
                                        height: 44,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: isActive ? T.accent : T.surface,
                                        border: `2px solid ${isActive ? T.accent : T.line}`,
                                        color: isActive ? T.accentInk : T.inkFaint,
                                        transition: "background .3s ease, border-color .3s ease, color .3s ease",
                                        zIndex: 2,
                                    }}
                                >
                                    <Icon size={19} />
                                </Box>

                                <Box
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        left: leftDot ? "34%" : "6%",
                                        right: leftDot ? "6%" : "34%",
                                        opacity: isActive ? 1 : 0.4,
                                        transition: "opacity .3s ease",
                                        textAlign: leftDot ? "left" : "right",
                                    }}
                                >
                                    <Text size="xs" fw={700} c={T.inkFaint} style={{ fontFamily: T.mono }} mb={4}>
                                        {stage.label.toUpperCase()} · 0{i + 1}
                                    </Text>
                                    <Text size="lg" fw={700} c={T.ink} mb={4}>{stage.title}</Text>
                                    <Text size="sm" c={T.inkMuted} maw={360} ml={leftDot ? 0 : "auto"} style={{ lineHeight: 1.55 }}>
                                        {stage.desc}
                                    </Text>
                                </Box>
                            </Box>
                        );
                    })}

                    {/* The travelling ticket — same ticket, whole trip, only its status changes */}
                    <Box
                        style={{
                            position: "absolute",
                            left: `${cardX}%`,
                            top: cardY - 58,
                            transform: "translate(-50%, -50%)",
                            zIndex: 3,
                            background: T.surface,
                            border: `1px solid ${T.line}`,
                            borderRadius: 8,
                            padding: "8px 12px",
                            boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.4)" : "0 6px 20px rgba(0,0,0,0.08)",
                            minWidth: 190,
                            pointerEvents: "none",
                        }}
                    >
                        <Group gap={6} wrap="nowrap" mb={2}>
                            <IconFileText size={13} color={T.inkFaint} />
                            <Text size="10px" c={T.inkFaint} style={{ fontFamily: T.mono }}>#4471</Text>
                        </Group>
                        <Text size="xs" fw={600} c={T.ink} mb={5} truncate>Checkout button not responding</Text>
                        <Box
                            style={{
                                display: "inline-block",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 20,
                                color: "#fff",
                                background: cardColor,
                                transition: "background .25s ease",
                            }}
                        >
                            {cardStage.label}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ---------------- Features ---------------- */}
            <Box id="features" px="md" pb={80} pt={40}>
                <Box style={{ maxWidth: 1080, margin: "0 auto" }}>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={20}>
                        {FEATURES.map((f) => {
                            const Icon = f.icon;
                            const color = T[f.color];
                            return (
                                <Box key={f.title} className="feature-card" p="lg" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 6 }}>
                                    <Icon size={20} color={color} style={{ marginBottom: 12 }} />
                                    <Text size="sm" fw={700} c={T.ink} mb={6}>{f.title}</Text>
                                    <Text size="xs" c={T.inkMuted} style={{ lineHeight: 1.55 }}>{f.desc}</Text>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                </Box>
            </Box>

            {/* ---------------- Roles ---------------- */}
            <Box ref={rolesRef} className={`reveal ${rolesVisible ? "in" : ""} m-auto`} px="md" pb={96}>
                <Box style={{ maxWidth: 1080, margin: "0 auto" }}>
                    <Stack gap={4} align="center" mb={40}>
                        <Text size="xs" fw={700} c={T.inkMuted} style={{ fontFamily: T.mono, letterSpacing: 1 }}>WHO'S INVOLVED</Text>
                        <Text fw={700} c={T.ink} size="26px">Two roles, one ticket</Text>
                    </Stack>
                  <Group justify="center" gap={20} wrap="wrap">
    {ROLES.map((r) => {
        const Icon = r.icon;
        return (
            <Box
                key={r.title}
                className="role-card"
                p="xl"
                style={{
                    background: T.surface,
                    border: `1px solid ${T.line}`,
                    borderRadius: 8,
                    textAlign: "center",
                    flex: "1 1 280px",
                    maxWidth: 320,
                }}
            >
                <Box
                    style={{
                        width: 46, height: 46, margin: "0 auto 14px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: T.accent, color: T.accentInk,
                    }}
                >
                    <Icon size={21} />
                </Box>
                <Text fw={700} c={T.ink} mb={6}>{r.title}</Text>
                <Text size="sm" c={T.inkMuted} style={{ lineHeight: 1.55 }}>{r.desc}</Text>
            </Box>
        );
    })}
</Group>
                </Box>
            </Box>

          
            <Box
                ref={ctaRef}
                className={`reveal ${ctaVisible ? "in" : ""}`}
                py={72}
                px="md"
                style={{ background: isDark ? "#0B0C0E" : "#111214" }}
            >
                <Stack gap={18} align="center" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
                    <Text fw={800} c="#F4F4F3" style={{ fontSize: "clamp(24px, 3.5vw, 34px)", lineHeight: 1.2 }}>
                        Stop losing track of who owns what.
                    </Text>
                    <Text size="sm" c="#9AA0A6">
                        Set up your first queue in a few minutes — no credit card required.
                    </Text>
                    <Button size="md" radius="sm" mt={4} style={{ background: "#F4F4F3", color: "#111214" }} rightSection={<IconArrowRight size={16} />} onClick={() => navigate(user ? "/tickets" : "/register")}>
                        {user ? "Go to your queue" : "Get started free"}
                    </Button>
                </Stack>
            </Box>

        </Box>
    );
}