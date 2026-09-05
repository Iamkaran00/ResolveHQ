// src/pages/Alerts.jsx

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Text,
    Group,
    Stack,
    Box,
    Button,
    SegmentedControl,
    Skeleton,
    useMantineColorScheme,
} from "@mantine/core";
import { IconAlertTriangle, IconClockExclamation, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { fetchAlerts, acknowledgeAlert } from "../redux/operations/slaOperations";
import StatusPill from "../components/StatusPill";

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

function Alerts() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    // same token set as HomePage.jsx — monochrome ink/accent, muted status
    // colors, no shared theme file yet so this is duplicated intentionally
    // to keep every page speaking the same visual language
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#5C6066" : "#ABAFA8",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3",
        urgent: "#B3401D",
        note: "#8A6D1D",
        good: "#2F5F3E",
        mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    };

    const TYPE_META = {
        breached: { label: "Breached", color: T.urgent, icon: IconAlertTriangle },
        at_risk: { label: "At risk", color: T.note, icon: IconClockExclamation },
    };

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

    return (
        <Box style={{ background: T.page, minHeight: "100vh" }}>
            <Box style={{ maxWidth: 780, margin: "0 auto", padding: "72px 24px 96px" }}>
                {/* Header */}
                <Stack gap={4} mb={40}>
                    <Text size="xs" fw={700} c={T.inkMuted} style={{ fontFamily: T.mono, letterSpacing: 1 }}>
                        SLA ALERTS
                    </Text>
                    <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                        <div>
                            <Text fw={700} c={T.ink} size="26px" mb={4}>
                                Alerts
                            </Text>
                            <Text size="sm" c={T.inkMuted}>
                                {alerts.length === 0
                                    ? "Nothing needs attention right now."
                                    : `${breachedCount} breached, ${atRiskCount} at risk`}
                            </Text>
                        </div>
                        <SegmentedControl
                            size="sm"
                            radius="xl"
                            value={view}
                            onChange={setView}
                            data={[
                                { value: "all", label: `All (${alerts.length})` },
                                { value: "breached", label: `Breached (${breachedCount})` },
                                { value: "at_risk", label: `At risk (${atRiskCount})` },
                            ].map((opt) => ({
                                value: opt.value,
                                label: (
                                    <span style={{ color: view === opt.value ? T.accentInk : T.inkMuted }}>
                                        {opt.label}
                                    </span>
                                ),
                            }))}
                            styles={{
                                root: { background: T.surface, border: `1px solid ${T.line}`, padding: 4 },
                                indicator: { background: T.accent, borderRadius: 999 },
                                label: {
                                    fontWeight: 600,
                                    fontSize: 13,
                                    padding: "8px 18px",
                                },
                            }}
                        />
                    </Group>
                </Stack>

                {/* Content */}
                {loading && alerts.length === 0 ? (
                    <Stack gap={12}>
                        <Skeleton height={76} radius={8} />
                        <Skeleton height={76} radius={8} />
                        <Skeleton height={76} radius={8} />
                    </Stack>
                ) : filtered.length === 0 ? (
                    <Box
                        style={{
                            background: T.surface,
                            border: `1px solid ${T.line}`,
                            borderRadius: 8,
                            padding: 48,
                            textAlign: "center",
                        }}
                    >
                        <IconCheck size={22} color={T.good} style={{ marginBottom: 10 }} />
                        <Text size="sm" c={T.inkMuted}>
                            {view === "all"
                                ? "No open alerts. Every ticket is inside its response target."
                                : `No ${TYPE_META[view].label.toLowerCase()} alerts right now.`}
                        </Text>
                    </Box>
                ) : (
                    <Stack gap={12}>
                        <AnimatePresence initial={false}>
                            {filtered.map((alert) => {
                                const meta = TYPE_META[alert.type] || TYPE_META.at_risk;
                                const Icon = meta.icon;
                                return (
                                    <motion.div
                                        key={alert._id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <Box
                                            style={{
                                                background: T.surface,
                                                border: `1px solid ${T.line}`,
                                                borderRadius: 8,
                                                overflow: "hidden",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => navigate(`/tickets/${alert.ticket?._id}`)}
                                        >
                                            <Group gap={0} wrap="nowrap" align="stretch">
                                                <div style={{ width: 3, background: meta.color, flexShrink: 0 }} />
                                                <Group justify="space-between" wrap="nowrap" p="md" style={{ flex: 1 }}>
                                                    <Group gap={14} wrap="nowrap" style={{ minWidth: 0 }}>
                                                        <Icon size={18} color={meta.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                                        <div style={{ minWidth: 0 }}>
                                                            <Text
                                                                size="xs"
                                                                fw={700}
                                                                tt="uppercase"
                                                                style={{ fontFamily: T.mono, letterSpacing: 0.5, color: meta.color }}
                                                                mb={4}
                                                            >
                                                                {meta.label} · {timeAgo(alert.createdAt)}
                                                            </Text>
                                                            <Text size="sm" fw={600} lineClamp={1} c={T.ink} mb={6}>
                                                                {alert.ticket?.subject || "Ticket unavailable"}
                                                            </Text>
                                                            <Group gap={8}>
                                                                {alert.ticket?.status && <StatusPill status={alert.ticket.status} />}
                                                                <Text size="xs" c={T.inkFaint} tt="capitalize">
                                                                    {alert.ticket?.priority}
                                                                </Text>
                                                            </Group>
                                                        </div>
                                                    </Group>

                                                    <Button
                                                        size="xs"
                                                        radius="sm"
                                                        variant="default"
                                                        loading={acking === alert._id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAcknowledge(alert._id);
                                                        }}
                                                        style={{ flexShrink: 0, borderColor: T.line, color: T.ink }}
                                                    >
                                                        Acknowledge
                                                    </Button>
                                                </Group>
                                            </Group>
                                        </Box>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default Alerts;