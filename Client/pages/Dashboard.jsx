// src/pages/Dashboard.jsx

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
    Text, Group, Stack, Paper, Skeleton, useMantineColorScheme,
    Container, SimpleGrid, Title, ThemeIcon, Box,
} from "@mantine/core";
import { IconInbox, IconClockPause, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";

import { fetchDashboard } from "../redux/operations/dashboardOperations";
import { fetchAgents } from "../redux/operations/ticketOperations";

// matches Mongo's $isoWeek (ISO-8601, Monday-start, week 1 contains the year's first Thursday)
const isoWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// builds the real last-8-week sequence
const buildLastEightWeeks = (resolvedPerWeek) => {
    const countByWeek = new Map((resolvedPerWeek || []).map((w) => [w._id, w.count]));
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 7);
        const wk = isoWeek(d);
        weeks.push({ week: wk, count: countByWeek.get(wk) || 0, isCurrent: i === 0 });
    }
    return weeks;
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function StatCard({ icon: Icon, label, value, tone, T }) {
    const isWarn = tone === "warn" && value > 0;
    const toneColor = isWarn ? T.urgent : T.ink;

    return (
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400 }}>
            <Paper
                p="lg"
                style={{
                    background: T.surface,
                    border: `1px solid ${isWarn ? T.urgent : T.line}`,
                    borderRadius: 10,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <Group justify="space-between" align="flex-start" mb="md">
                    <Text size="xs" fw={700} c={T.inkMuted}>{label}</Text>
                    <ThemeIcon
                        variant="light"
                        size="lg"
                        radius="md"
                        style={{
                            background: isWarn ? "rgba(179,64,29,0.12)" : T.accentTint,
                            color: toneColor,
                        }}
                    >
                        <Icon size={19} />
                    </ThemeIcon>
                </Group>
                <Text size="36px" fw={800} style={{ color: toneColor, lineHeight: 1 }}>
                    {value}
                </Text>
            </Paper>
        </motion.div>
    );
}

function Dashboard() {
    const dispatch = useDispatch();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    // Same tokens as the rest of the app, plus the same status→color mapping
    // used on the ticket page and homepage, so "pending" always means brass
    // and "closed" always means brick, everywhere you see it.
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#6B6F76" : "#9CA0A6",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentTint: isDark ? "rgba(244,244,243,0.10)" : "rgba(14,15,17,0.05)",
        urgent: "#B3401D",
        note: "#8A6D1D",
        good: "#2F5F3E",
        track: isDark ? "#22252A" : "#EEEDE8",
    };

    const STATUS_COLOR = { new: T.inkFaint, open: T.accent, pending: T.note, resolved: T.good, closed: T.urgent };

    const { headline, byStatus, byAgent, resolvedPerWeek, loading } = useSelector((state) => state.dashboard);
    const { agents } = useSelector((state) => state.ticket);

    useEffect(() => {
        dispatch(fetchDashboard());
        dispatch(fetchAgents());
    }, [dispatch]);

    const agentNameById = useMemo(() => {
        const map = new Map((agents || []).map((a) => [a._id, a.name]));
        return (id) => (id ? map.get(id) || "Unknown agent" : "Unassigned");
    }, [agents]);

    const maxStatusCount = Math.max(1, ...byStatus.map((s) => s.count));
    const maxAgentCount = Math.max(1, ...byAgent.map((a) => a.count));
    const weeks = useMemo(() => buildLastEightWeeks(resolvedPerWeek), [resolvedPerWeek]);
    const maxWeekCount = Math.max(1, ...weeks.map((w) => w.count));

    const cardStyle = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10 };

    if (loading && byStatus.length === 0) {
        return (
            <Box style={{ background: T.page, minHeight: "100vh" }}>
                <Container size="xl" pt={100} pb="xl">
                    <Skeleton height={36} width={180} mb="xl" radius="sm" />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
                        <Skeleton height={130} radius="md" />
                        <Skeleton height={130} radius="md" />
                        <Skeleton height={130} radius="md" />
                        <Skeleton height={130} radius="md" />
                    </SimpleGrid>
                    <Skeleton height={280} radius="md" />
                </Container>
            </Box>
        );
    }

    return (
        <Box style={{ background: T.page, minHeight: "100vh" }}>
            {/* pt={100} clears a fixed navbar — adjust to your navbar's actual height */}
            <Container size="xl" pt={100} pb="xl">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <Title order={1} mb={4} style={{ color: T.ink, letterSpacing: "-0.5px" }}>Overview</Title>
                    <Text c={T.inkMuted} mb="xl" size="sm">Ticketing performance and agent workload, at a glance.</Text>
                </motion.div>

                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    {/* Headline stats */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
                        <StatCard icon={IconInbox} label="Open" value={headline.open} T={T} />
                        <StatCard icon={IconClockPause} label="Pending on customer" value={headline.pending} T={T} />
                        <StatCard icon={IconCircleCheck} label="Resolved this week" value={headline.resolvedThisWeek} T={T} />
                        <StatCard icon={IconAlertTriangle} label="Breaching SLA" value={headline.breaching} tone="warn" T={T} />
                    </SimpleGrid>

                    {/* Status & agent breakdown */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                        <motion.div variants={itemVariants}>
                            <Paper style={cardStyle} p="xl" h="100%">
                                <Text size="xs" fw={700} c={T.inkMuted} mb="lg">Tickets by status</Text>
                                <Stack gap={16}>
                                    {byStatus.length === 0 && <Text size="sm" c={T.inkFaint}>No tickets yet.</Text>}
                                    {byStatus.map((s, index) => (
                                        <div key={s._id}>
                                            <Group justify="space-between" mb={6}>
                                                <Text size="sm" fw={600} tt="capitalize" c={T.ink}>{s._id}</Text>
                                                <Text size="sm" fw={700} c={T.ink}>{s.count}</Text>
                                            </Group>
                                            <div style={{ height: 8, borderRadius: 4, background: T.track, overflow: "hidden" }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                                    style={{ height: "100%", background: STATUS_COLOR[s._id] || T.inkFaint, borderRadius: 4 }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </Stack>
                            </Paper>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Paper style={cardStyle} p="xl" h="100%">
                                <Text size="xs" fw={700} c={T.inkMuted} mb="lg">Tickets by agent</Text>
                                <Stack gap={16}>
                                    {byAgent.length === 0 && <Text size="sm" c={T.inkFaint}>Nothing assigned yet.</Text>}
                                    {byAgent
                                        .slice()
                                        .sort((a, b) => b.count - a.count)
                                        .map((a, index) => (
                                            <div key={a._id || "unassigned"}>
                                                <Group justify="space-between" mb={6}>
                                                    <Text size="sm" fw={600} c={T.ink}>{agentNameById(a._id)}</Text>
                                                    <Text size="sm" fw={700} c={T.ink}>{a.count}</Text>
                                                </Group>
                                                <div style={{ height: 8, borderRadius: 4, background: T.track, overflow: "hidden" }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(a.count / maxAgentCount) * 100}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                                        style={{ height: "100%", background: a._id ? T.accent : T.inkFaint, borderRadius: 4 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </Stack>
                            </Paper>
                        </motion.div>
                    </SimpleGrid>

                    {/* Resolution velocity */}
                    <motion.div variants={itemVariants}>
                        <Paper style={cardStyle} p="xl">
                            <Text size="xs" fw={700} c={T.inkMuted} mb="xl">Resolution velocity — last 8 weeks</Text>
                            <Group align="flex-end" gap="md" style={{ height: 160, width: "100%" }} wrap="nowrap">
                                {weeks.map((w, index) => (
                                    <div key={w.week} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                                        <Text size="xs" fw={700} c={T.ink} mb={8}>{w.count}</Text>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max((w.count / maxWeekCount) * 100, w.count > 0 ? 8 : 4)}px` }}
                                            transition={{ duration: 0.6, delay: 0.4 + index * 0.05, type: "spring", bounce: 0.3 }}
                                            style={{
                                                width: "100%",
                                                maxWidth: 40,
                                                borderRadius: "6px 6px 0 0",
                                                background: w.isCurrent ? T.accent : T.track,
                                            }}
                                            whileHover={{ scaleY: 1.05, opacity: 0.9, originY: 1 }}
                                        />
                                        <Text size="xs" c={T.inkFaint} mt={12} fw={600}>
                                            {w.isCurrent ? "Current" : `W${w.week}`}
                                        </Text>
                                    </div>
                                ))}
                            </Group>
                        </Paper>
                    </motion.div>
                </motion.div>
            </Container>
        </Box>
    );
}

export default Dashboard;