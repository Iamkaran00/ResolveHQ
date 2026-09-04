import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Text,
    Group,
    Stack,
    Paper,
    Button,
    SegmentedControl,
    Skeleton,
    useComputedColorScheme,
    Container,
    Box,
    Title,
    ThemeIcon,
    Flex
} from "@mantine/core";
import { IconAlertTriangle, IconClockExclamation, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { fetchAlerts, acknowledgeAlert } from "../redux/operations/slaOperations";
import StatusPill from "../components/StatusPill";

const TYPE_META = {
    breached: {
        label: "Breached",
        color: "#e03131",
        bg: { dark: "rgba(224, 49, 49, 0.08)", light: "#fff5f5" },
        icon: IconAlertTriangle,
    },
    at_risk: {
        label: "At Risk",
        color: "#f08c00",
        bg: { dark: "rgba(240, 140, 0, 0.08)", light: "#fff9db" },
        icon: IconClockExclamation,
    },
};

const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 24 } },
    exit: { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }
};

function Alerts() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const computedScheme = useComputedColorScheme("light");
    const isDark = computedScheme === "dark";

    const { alerts, loading } = useSelector((state) => state.alert);
    const [view, setView] = useState("all");
    const [acking, setAcking] = useState(null);

    useEffect(() => {
        dispatch(fetchAlerts());
    }, [dispatch]);

    const filtered = useMemo(() => {
        if (view === "all") return alerts;
        return alerts.filter((a) => a.type === view);
    }, [alerts, view]);

    const breachedCount = alerts.filter((a) => a.type === "breached").length;
    const atRiskCount = alerts.filter((a) => a.type === "at_risk").length;

    const handleAcknowledge = async (alertId) => {
        setAcking(alertId);
        const res = await dispatch(acknowledgeAlert(alertId));
        setAcking(null);
        if (!res.success) {
            notifications.show({ title: "Couldn't acknowledge", message: res.message, color: "red" });
        }
    };

    const cardBg = isDark ? "#1A1D24" : "#FFFFFF";
    const textPrimary = isDark ? "#FAFAF9" : "#0F1115";
    const border = isDark ? "#2C2E33" : "#E9ECEF";

    return (
        <Box 
            style={{ 
                minHeight: "100vh", 
                backgroundColor: isDark ? "#0F1115" : "#F4F5F7",
                width: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 0
            }}
        >
            <Container size="md" pt={100} pb="xl" style={{ position: "relative", zIndex: 1 }}>
                
                {/* Header Section */}
                <Flex 
                    justify="space-between" 
                    align={{ base: "flex-start", sm: "flex-end" }} 
                    direction={{ base: "column", sm: "row" }}
                    gap="md"
                    mb="xl"
                >
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <Title order={1} mb={4} style={{ color: textPrimary, letterSpacing: "-1px" }}>
                            Alerts
                        </Title>
                        <Text size="sm" c="dimmed" fw={500}>
                            {alerts.length === 0
                                ? "Inbox zero! No active alerts."
                                : `${breachedCount} breached, ${atRiskCount} at risk`}
                        </Text>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                        <SegmentedControl
                            size="sm"
                            radius="md"
                            value={view}
                            onChange={setView}
                            data={[
                                { label: `All (${alerts.length})`, value: "all" },
                                { label: `Breached (${breachedCount})`, value: "breached" },
                                { label: `At Risk (${atRiskCount})`, value: "at_risk" },
                            ]}
                        />
                    </motion.div>
                </Flex>

                {/* Content Section */}
                {loading && alerts.length === 0 ? (
                    <Stack gap="md">
                        <Skeleton height={88} radius="lg" />
                        <Skeleton height={88} radius="lg" />
                        <Skeleton height={88} radius="lg" />
                    </Stack>
                ) : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Paper 
                            withBorder 
                            radius="lg" 
                            p={40} 
                            style={{ 
                                background: cardBg, 
                                borderColor: border, 
                                borderStyle: 'dashed',
                                textAlign: "center",
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <ThemeIcon size={64} radius="100%" variant="light" color="green" mb="md">
                                <IconCheck size={32} />
                            </ThemeIcon>
                            <Text size="lg" fw={600} style={{ color: textPrimary }} mb={4}>
                                You're all caught up!
                            </Text>
                            <Text size="sm" c="dimmed">
                                {view === "all"
                                    ? "There are no open alerts. Every ticket is inside its response target."
                                    : `There are no ${TYPE_META[view].label.toLowerCase()} alerts right now.`}
                            </Text>
                        </Paper>
                    </motion.div>
                ) : (
                    <motion.div variants={listVariants} initial="hidden" animate="show">
                        <Stack gap="md">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((alert) => {
                                    const meta = TYPE_META[alert.type] || TYPE_META.at_risk;
                                    const Icon = meta.icon;
                                    const tintBg = isDark ? meta.bg.dark : meta.bg.light;

                                    return (
                                        <motion.div
                                            key={alert._id}
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="show"
                                            exit="exit"
                                            whileHover={{ scale: 1.01, y: -2 }}
                                        >
                                            <Paper
                                                withBorder
                                                radius="lg"
                                                shadow="sm"
                                                style={{ 
                                                    background: cardBg, 
                                                    borderColor: border, 
                                                    overflow: "hidden",
                                                    transition: "border-color 0.2s ease"
                                                }}
                                            >
                                                <Group gap={0} wrap="nowrap" align="stretch">
                                                    {/* Status Indicator Bar */}
                                                    <div style={{ width: 6, background: meta.color, flexShrink: 0 }} />
                                                    
                                                    {/* Main Content Area */}
                                                    <Group
                                                        justify="space-between"
                                                        wrap="nowrap"
                                                        p="md"
                                                        style={{ flex: 1, cursor: "pointer", background: tintBg }}
                                                        onClick={() => navigate(`/tickets/${alert.ticket?._id}`)}
                                                    >
                                                        <Group gap={16} wrap="nowrap" style={{ minWidth: 0 }}>
                                                            <ThemeIcon size={40} radius="md" color={meta.color} variant="light" style={{ flexShrink: 0 }}>
                                                                <Icon size={24} />
                                                            </ThemeIcon>
                                                            
                                                            <div style={{ minWidth: 0 }}>
                                                                <Group gap={8} mb={4}>
                                                                    <Text size="xs" fw={800} tt="uppercase" lts={0.5} style={{ color: meta.color }}>
                                                                        {meta.label}
                                                                    </Text>
                                                                    <Text size="xs" c="dimmed" fw={500}>
                                                                        · flagged {timeAgo(alert.createdAt)}
                                                                    </Text>
                                                                </Group>
                                                                
                                                                <Text
                                                                    size="md"
                                                                    fw={600}
                                                                    lineClamp={1}
                                                                    style={{ color: textPrimary, letterSpacing: "-0.2px" }}
                                                                >
                                                                    {alert.ticket?.subject || "Ticket unavailable"}
                                                                </Text>
                                                                
                                                                <Group gap={8} mt={6}>
                                                                    {alert.ticket?.status && <StatusPill status={alert.ticket.status} />}
                                                                    <Text size="xs" c="dimmed" tt="capitalize" fw={500}>
                                                                        Priority: {alert.ticket?.priority}
                                                                    </Text>
                                                                </Group>
                                                            </div>
                                                        </Group>

                                                        {/* Action Button */}
                                                        <Button
                                                            size="sm"
                                                            radius="md"
                                                            variant={isDark ? "filled" : "white"}
                                                            color={isDark ? "dark.4" : "gray"}
                                                            loading={acking === alert._id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAcknowledge(alert._id);
                                                            }}
                                                            style={{ 
                                                                flexShrink: 0,
                                                                border: `1px solid ${border}`,
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                            }}
                                                        >
                                                            Acknowledge
                                                        </Button>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </Stack>
                    </motion.div>
                )}
            </Container>
        </Box>
    );
}

export default Alerts;