import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    Text, 
    Group, 
    Stack, 
    Paper, 
    Skeleton, 
    useMantineColorScheme, 
    Container, 
    SimpleGrid,
    Title,
    ThemeIcon,
    Box
} from "@mantine/core";
import { IconInbox, IconClockPause, IconCircleCheck, IconAlertTriangle } from "@tabler/icons-react";

import { fetchDashboard } from "../redux/operations/dashboardOperations";
import { fetchAgents } from "../redux/operations/ticketOperations";

const STATUS_COLOR = {
    new: "#5B6B8C",
    open: "#2F8F5B",
    pending: "#C97A2B",
    resolved: "#5B6B8C",
    closed: "#7A828E",
};

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

// --- Framer Motion Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function StatCard({ icon: Icon, label, value, tone, isDark }) {
    const toneColor = { default: "#5B6B8C", warn: "#e03131" }[tone] || "#5B6B8C";
    const bg = isDark ? "#1A1D24" : "#FFFFFF";
    const border = tone === "warn" && value > 0 ? toneColor : isDark ? "#2C2E33" : "#E9ECEF";

    return (
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400 }}>
            <Paper
                withBorder
                radius="lg"
                p="lg"
                shadow="sm"
                style={{
                    background: bg,
                    borderColor: border,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                }}
            >
                <Group justify="space-between" align="flex-start" mb="md">
                    <Text size="sm" fw={600} c="dimmed" tt="uppercase" lts={1}>
                        {label}
                    </Text>
                    <ThemeIcon 
                        variant={tone === "warn" ? "light" : "default"} 
                        color={tone === "warn" ? "red" : "gray"} 
                        size="lg" 
                        radius="md"
                        style={{ border: isDark && tone !== "warn" ? '1px solid #2C2E33' : undefined }}
                    >
                        <Icon size={20} color={tone === "warn" ? undefined : toneColor} />
                    </ThemeIcon>
                </Group>
                <Text size="38px" fw={800} style={{ color: tone === "warn" && value > 0 ? toneColor : isDark ? "#FAFAF9" : "#0F1115", lineHeight: 1 }}>
                    {value}
                </Text>
            </Paper>
        </motion.div>
    );
}

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

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

    const cardBg = isDark ? "#1A1D24" : "#FFFFFF";
    const pageBg = isDark ? "#0F1115" : "#F4F5F7";
    const textPrimary = isDark ? "#FAFAF9" : "#0F1115";
    const border = isDark ? "#2C2E33" : "#E9ECEF";

    if (loading && byStatus.length === 0) {
        return (
            <Container size="xl" pt={100} pb="xl">
                <Skeleton height={40} width={200} mb="xl" radius="md" />
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
                    <Skeleton height={140} radius="lg" />
                    <Skeleton height={140} radius="lg" />
                    <Skeleton height={140} radius="lg" />
                    <Skeleton height={140} radius="lg" />
                </SimpleGrid>
                <Skeleton height={300} radius="lg" />
            </Container>
        );
    }

    return (
        <Box bg={pageBg} minHeight="100vh">
            {/* The 'pt={100}' (padding-top) pushes the content down so it doesn't hide behind a fixed navbar.
              Adjust this value based on your exact navbar height! 
            */}
            <Container size="xl" pt={100} pb="xl">
                
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <Title order={1} mb="xs" style={{ color: textPrimary, letterSpacing: "-1px" }}>
                        Overview
                    </Title>
                    <Text c="dimmed" mb="xl" size="sm">
                        Track your ticketing performance and agent workloads.
                    </Text>
                </motion.div>

                <motion.div variants={containerVariants} initial="hidden" animate="show">
                    
                    {/* Top Stats */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
                        <StatCard icon={IconInbox} label="Open" value={headline.open} isDark={isDark} />
                        <StatCard icon={IconClockPause} label="Pending (Customer)" value={headline.pending} isDark={isDark} />
                        <StatCard icon={IconCircleCheck} label="Resolved (Weekly)" value={headline.resolvedThisWeek} isDark={isDark} />
                        <StatCard icon={IconAlertTriangle} label="Breaching SLA" value={headline.breaching} tone="warn" isDark={isDark} />
                    </SimpleGrid>

                    {/* Middle Section: Status & Agents */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
                        
                        <motion.div variants={itemVariants}>
                            <Paper withBorder radius="lg" p="xl" shadow="sm" style={{ background: cardBg, borderColor: border, height: '100%' }}>
                                <Text size="sm" fw={700} c="dimmed" tt="uppercase" lts={1} mb="lg">
                                    Tickets by Status
                                </Text>
                                <Stack gap={16}>
                                    {byStatus.length === 0 && <Text size="sm" c="dimmed">No tickets yet.</Text>}
                                    {byStatus.map((s, index) => (
                                        <div key={s._id}>
                                            <Group justify="space-between" mb={6}>
                                                <Text size="sm" fw={500} tt="capitalize" style={{ color: textPrimary }}>
                                                    {s._id}
                                                </Text>
                                                <Text size="sm" fw={600} style={{ color: textPrimary }}>
                                                    {s.count}
                                                </Text>
                                            </Group>
                                            <div style={{ height: 8, borderRadius: 4, background: isDark ? "#2A2D35" : "#F0F0EE", overflow: "hidden" }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                                    style={{ height: "100%", background: STATUS_COLOR[s._id] || "#5B6B8C", borderRadius: 4 }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </Stack>
                            </Paper>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Paper withBorder radius="lg" p="xl" shadow="sm" style={{ background: cardBg, borderColor: border, height: '100%' }}>
                                <Text size="sm" fw={700} c="dimmed" tt="uppercase" lts={1} mb="lg">
                                    Tickets by Agent
                                </Text>
                                <Stack gap={16}>
                                    {byAgent.length === 0 && <Text size="sm" c="dimmed">Nothing assigned yet.</Text>}
                                    {byAgent
                                        .slice()
                                        .sort((a, b) => b.count - a.count)
                                        .map((a, index) => (
                                            <div key={a._id || "unassigned"}>
                                                <Group justify="space-between" mb={6}>
                                                    <Text size="sm" fw={500} style={{ color: textPrimary }}>
                                                        {agentNameById(a._id)}
                                                    </Text>
                                                    <Text size="sm" fw={600} style={{ color: textPrimary }}>
                                                        {a.count}
                                                    </Text>
                                                </Group>
                                                <div style={{ height: 8, borderRadius: 4, background: isDark ? "#2A2D35" : "#F0F0EE", overflow: "hidden" }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(a.count / maxAgentCount) * 100}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                                        style={{ height: "100%", background: a._id ? "#339AF0" : "#868E96", borderRadius: 4 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </Stack>
                            </Paper>
                        </motion.div>

                    </SimpleGrid>

                    {/* Bottom Section: Bar Chart */}
                    <motion.div variants={itemVariants}>
                        <Paper withBorder radius="lg" p="xl" shadow="sm" style={{ background: cardBg, borderColor: border }}>
                            <Text size="sm" fw={700} c="dimmed" tt="uppercase" lts={1} mb="xl">
                                Resolution Velocity (Last 8 Weeks)
                            </Text>
                            <Group align="flex-end" gap="md" style={{ height: 160, width: '100%' }} wrap="nowrap">
                                {weeks.map((w, index) => (
                                    <div key={w.week} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                                        <Text size="xs" fw={600} style={{ color: textPrimary }} mb={8}>
                                            {w.count}
                                        </Text>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max((w.count / maxWeekCount) * 100, w.count > 0 ? 8 : 4)}px` }}
                                            transition={{ duration: 0.6, delay: 0.4 + (index * 0.05), type: "spring", bounce: 0.3 }}
                                            style={{
                                                width: "100%",
                                                maxWidth: 40,
                                                borderRadius: "6px 6px 0 0",
                                                background: w.isCurrent 
                                                    ? "linear-gradient(180deg, #339AF0 0%, #228BE6 100%)" 
                                                    : isDark ? "#2C2E33" : "#E1E4EA",
                                            }}
                                            whileHover={{ scaleY: 1.05, opacity: 0.9, originY: 1 }}
                                        />
                                        <Text size="xs" c="dimmed" mt={12} fw={500}>
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