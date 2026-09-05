// src/pages/TicketDetail.jsx

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
    Text,
    Group,
    Stack,
    Paper,
    Button,
    ActionIcon,
    Select,
    Textarea,
    TextInput,
    Tabs,
    Avatar,
    Divider,
    useMantineColorScheme,
    Skeleton,
    Box,
} from "@mantine/core";
import {
    IconArrowLeft,
    IconArchive,
    IconArchiveOff,
    IconPencil,
    IconCheck,
    IconX,
    IconUserPlus,
    IconSend,
    IconClock,
    IconMessageCircle,
    IconHistory,
    IconUserCheck,
    IconUsersGroup,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
    fetchTicketById,
    updateTicket,
    archiveTicket,
    restoreTicket,
    reassignTicket,
    updateTicketStatus,
    addCollaborator,
    removeCollaborator,
    fetchAgents,
    fetchMessages,
    addMessage,
    fetchTimeline,
} from "../redux/operations/ticketOperations";
import { clearTicketState } from "../redux/slices/ticketSlice";

import SlaTimer from "../components/SlaTime";
import PriorityBar from "../components/PriorityBar";
import StatusPill from "../components/StatusPill";

const TRANSITIONS = {
    new: ["open"],
    open: ["pending", "resolved"],
    pending: ["open", "resolved"],
    resolved: ["closed", "open"],
    closed: ["open"],
};

const ACTION_LABEL = {
    "new>open": "Start working",
    "open>pending": "Wait on customer",
    "open>resolved": "Mark resolved",
    "pending>open": "Resume",
    "pending>resolved": "Mark resolved",
    "resolved>closed": "Close ticket",
    "resolved>open": "Reopen",
    "closed>open": "Reopen",
};

const TIMELINE_LABEL = (event) => {
    const who = event.actor?.name || "Someone";
    switch (event.type) {
        case "status_change":
            return `${who} moved this from ${event.oldStatus} to ${event.newStatus}`;
        case "assignment":
            return event.oldAssignee
                ? `${who} reassigned this from ${event.oldAssignee.name} to ${event.newAssignee.name}`
                : `${who} assigned this to ${event.newAssignee.name}`;
        case "collaborator_added":
            return `${who} added ${event.collaborator?.name} as a collaborator`;
        case "collaborator_removed":
            return `${who} removed ${event.collaborator?.name} as a collaborator`;
        case "priority_change":
            return `${who} changed priority from ${event.oldPriority} to ${event.newPriority}`;
        case "archived":
            return `${who} archived this ticket`;
        case "restored":
            return `${who} restored this ticket`;
        case "reply":
            return `${who} replied`;
        case "internal_note":
            return `${who} left an internal note`;
        default:
            return `${who} updated this ticket`;
    }
};

export default function TicketDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    // Same monochrome system as the navbar and homepage: black/white accent
    // instead of a brand blue, plus three semantic colors reserved for the
    // things on this page that carry actual meaning.
    const T = {
        page: isDark ? "#101214" : "#F7F7F4",
        surface: isDark ? "#17191C" : "#FFFFFF",
        ink: isDark ? "#ECEDEE" : "#1B1D1F",
        inkMuted: isDark ? "#9AA0A6" : "#6E7278",
        inkFaint: isDark ? "#6B6F76" : "#9CA0A6",
        line: isDark ? "#262A2E" : "#E6E4DD",
        accent: isDark ? "#F4F4F3" : "#0E0F11",
        accentInk: isDark ? "#0E0F11" : "#F4F4F3",
        accentTint: isDark ? "rgba(244,244,243,0.10)" : "rgba(14,15,17,0.05)",
        urgent: "#B3401D", // closing / archiving
        note: "#8A6D1D", // internal-only
        good: "#2F5F3E", // resolved / restored
        mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    };

    const { currentTicket: ticket, messages, timeline, agents, loading } = useSelector(
        (state) => state.ticket
    );
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState("conversation");
    const [editingFields, setEditingFields] = useState(false);
    const [draft, setDraft] = useState({ subject: "", description: "" });
    const [replyBody, setReplyBody] = useState("");
    const [replyKind, setReplyKind] = useState("reply");
    const [reassignTarget, setReassignTarget] = useState(null);
    const [collaboratorTarget, setCollaboratorTarget] = useState(null);
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        dispatch(fetchTicketById(id));
        dispatch(fetchMessages(id));
        dispatch(fetchTimeline(id));
        dispatch(fetchAgents());
        return () => dispatch(clearTicketState());
    }, [id, dispatch]);

    useEffect(() => {
        if (ticket) setDraft({ subject: ticket.subject, description: ticket.description });
    }, [ticket]);

    const userId = user?.id;
    const isSupervisor = user?.role === "supervisor";
    const primaryId = ticket?.primaryAssignee?._id;
    const isPrimary = primaryId === userId;
    const isCollaborator = ticket?.collaborators?.some((c) => c._id === userId);

    const canReassign = isSupervisor || (isCollaborator && !isPrimary);
    const canManageCollaborators = isSupervisor || isPrimary;

    const availableTransitions = useMemo(() => {
        if (!ticket) return [];
        const targets = TRANSITIONS[ticket.status] || [];
        return targets.filter((t) => t !== "closed" || isSupervisor);
    }, [ticket, isSupervisor]);

    const agentOptions = useMemo(
        () => (agents || []).map((a) => ({ value: a._id, label: `${a.name} (${a.email})` })),
        [agents]
    );

    const reassignOptions = useMemo(
        () => agentOptions.filter((a) => a.value !== primaryId),
        [agentOptions, primaryId]
    );

    const collaboratorOptions = useMemo(
        () => agentOptions.filter((a) => a.value !== primaryId && !ticket?.collaborators?.some((c) => c._id === a.value)),
        [agentOptions, primaryId, ticket?.collaborators]
    );

    const handleSaveFields = async () => {
        const res = await dispatch(updateTicket(id, draft));
        if (res.success) {
            notifications.show({ title: "Saved", message: "Ticket details updated.", color: "teal" });
            setEditingFields(false);
        } else {
            notifications.show({ title: "Couldn't save", message: res.message, color: "red" });
        }
    };

    const handleArchiveToggle = async () => {
        const action = ticket.archived ? restoreTicket : archiveTicket;
        const res = await dispatch(action(id));
        if (res.success) {
            notifications.show({
                title: ticket.archived ? "Restored" : "Archived",
                message: ticket.archived ? "Ticket restored to queue." : "Ticket archived.",
                color: "teal",
            });
        } else {
            notifications.show({ title: "Action failed", message: res.message, color: "red" });
        }
    };

    const handleTransition = async (newStatus) => {
        const res = await dispatch(updateTicketStatus(id, newStatus));
        if (res.success) {
            notifications.show({ title: "Status updated", message: `Ticket is now ${newStatus}.`, color: "teal" });
            dispatch(fetchTimeline(id));
        } else {
            notifications.show({ title: "Move refused", message: res.message, color: "red" });
        }
    };

    const handleReassign = async () => {
        if (!reassignTarget) return;
        const res = await dispatch(reassignTicket(id, reassignTarget));
        if (res.success) {
            notifications.show({ title: "Reassigned", message: "Primary assignee updated.", color: "teal" });
            setReassignTarget(null);
            dispatch(fetchTimeline(id));
        } else {
            notifications.show({ title: "Reassign failed", message: res.message, color: "red" });
        }
    };

    const handleAddCollaborator = async () => {
        if (!collaboratorTarget) return;
        const res = await dispatch(addCollaborator(id, collaboratorTarget));
        if (res.success) {
            notifications.show({ title: "Collaborator added", message: "", color: "teal" });
            setCollaboratorTarget(null);
            dispatch(fetchTimeline(id));
        } else {
            notifications.show({ title: "Couldn't add collaborator", message: res.message, color: "red" });
        }
    };

    const handleRemoveCollaborator = async (agentId) => {
        const res = await dispatch(removeCollaborator(id, agentId));
        if (res.success) dispatch(fetchTimeline(id));
        else notifications.show({ title: "Couldn't remove collaborator", message: res.message, color: "red" });
    };

    const handleSendReply = async () => {
        if (!replyBody.trim()) return;
        setSubmittingReply(true);
        const res = await dispatch(addMessage(id, replyBody.trim(), replyKind === "internal_note"));
        setSubmittingReply(false);
        if (res.success) {
            setReplyBody("");
            dispatch(fetchTimeline(id));
        } else {
            notifications.show({ title: "Couldn't send", message: res.message, color: "red" });
        }
    };

    if (loading && !ticket) {
        return (
            <Box style={{ maxWidth: 1200, margin: "0 auto", background: T.page, minHeight: "100vh" }} p="xl">
                <Skeleton height={24} width={140} mb="xl" radius="sm" />
                <Skeleton height={140} radius="md" mb="md" />
                <Skeleton height={350} radius="md" />
            </Box>
        );
    }

    if (!ticket) return null;

    const shortId = String(id).slice(-6).toUpperCase();

    // A small colored icon chip used as the header for every sidebar
    // section, so each block reads as its own clearly-bounded thing.
    const ChipHeader = ({ icon: Icon, label, color }) => (
        <Group gap={8} mb={12}>
            <Box
                style={{
                    width: 26, height: 26, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: color, color: "#fff", flexShrink: 0,
                }}
            >
                <Icon size={14} />
            </Box>
            <Text size="sm" fw={700} c={T.ink}>{label}</Text>
        </Group>
    );

    const cardStyle = {
        background: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: 10,
    };

    return (
        <Box style={{ background: T.page, minHeight: "100vh" }}>
            <Box style={{ maxWidth: 1200, margin: "0 auto" }} p={{ base: "md", sm: "xl" }}>
                {/* Top bar */}
                <Group justify="space-between" align="center" mb="lg">
                    <Group gap={8} onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
                        <IconArrowLeft size={16} color={T.inkMuted} />
                        <Text size="sm" fw={600} c={T.inkMuted}>Back to queue</Text>
                        <Text size="sm" c={T.inkFaint}>·</Text>
                    </Group>

                    <Button
                        variant={ticket.archived ? "light" : "default"}
                        color={ticket.archived ? "teal" : "gray"}
                        size="xs"
                        radius="sm"
                        leftSection={ticket.archived ? <IconArchiveOff size={14} /> : <IconArchive size={14} />}
                        onClick={handleArchiveToggle}
                    >
                        {ticket.archived ? "Restore ticket" : "Archive ticket"}
                    </Button>
                </Group>

                {/* Layout grid */}
                <Box
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr minmax(300px, 340px)",
                        gap: 24,
                        alignItems: "start",
                    }}
                >
                    {/* Main column */}
                    <Stack gap="lg">
                        {/* Overview block */}
                        <Paper style={cardStyle}>
                            <Box style={{ display: "flex" }}>
                                <Box style={{ width: 5, borderRadius: "10px 0 0 10px", overflow: "hidden" }}>
                                    <PriorityBar priority={ticket.priority} />
                                </Box>
                                <Box style={{ flex: 1 }} p="lg">
                                    <Group justify="space-between" align="flex-start" mb={8} wrap="nowrap" gap="md">
                                        {editingFields ? (
                                            <TextInput
                                                value={draft.subject}
                                                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                                                style={{ flex: 1 }}
                                                size="md"
                                                radius="sm"
                                                styles={{ input: { fontSize: 20, fontWeight: 700 } }}
                                            />
                                        ) : (
                                            <Text size="24px" fw={700} c={T.ink} style={{ lineHeight: 1.3 }}>
                                                {ticket.subject}
                                            </Text>
                                        )}

                                        <Group gap={8} wrap="nowrap">
                                            <StatusPill status={ticket.status} />
                                            {editingFields ? (
                                                <Group gap={4}>
                                                    <ActionIcon size="sm" variant="light" color="teal" radius="sm" onClick={handleSaveFields} aria-label="Save changes">
                                                        <IconCheck size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        size="sm" variant="light" color="gray" radius="sm"
                                                        aria-label="Discard changes"
                                                        onClick={() => {
                                                            setEditingFields(false);
                                                            setDraft({ subject: ticket.subject, description: ticket.description });
                                                        }}
                                                    >
                                                        <IconX size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            ) : (
                                                <ActionIcon size="sm" variant="subtle" color="gray" radius="sm" aria-label="Edit ticket" onClick={() => setEditingFields(true)}>
                                                    <IconPencil size={14} />
                                                </ActionIcon>
                                            )}
                                        </Group>
                                    </Group>

                                    {editingFields ? (
                                        <Textarea
                                            value={draft.description}
                                            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                            autosize
                                            minRows={3}
                                            radius="sm"
                                            mt={8}
                                        />
                                    ) : (
                                        <Text size="sm" c={T.inkMuted} style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }} mt={8}>
                                            {ticket.description}
                                        </Text>
                                    )}

                                    <Group gap="md" mt="md" pt="sm" style={{ borderTop: `1px solid ${T.line}` }}>
                                        <Group gap={8}>
                                            <Avatar size="sm" radius="xl" color="dark">
                                                {ticket.requester?.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Text size="sm" fw={600} c={T.ink}>{ticket.requester?.name}</Text>
                                            <Text size="xs" c={T.inkFaint}>{ticket.requester?.email}</Text>
                                        </Group>
                                        <Box
                                            style={{
                                                fontSize: 12, fontWeight: 600, color: T.inkMuted,
                                                border: `1px solid ${T.line}`, borderRadius: 20, padding: "2px 10px",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {ticket.category}
                                        </Box>
                                    </Group>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Conversation / History block */}
                        <Paper style={cardStyle}>
                        <Tabs
    value={activeTab}
    onChange={setActiveTab}
    variant="pills"
    styles={{
        root: {
            "--tabs-color": T.accent,
            "--tabs-text-color": T.accentInk,
        },
        list: { padding: "12px 16px 0", gap: 4 },
        tab: {
            fontSize: 13,
            fontWeight: 600,
            color: T.inkMuted,
        },
    }}
>
                                <Tabs.List>
                                    <Tabs.Tab value="conversation" leftSection={<IconMessageCircle size={15} />}>Conversation</Tabs.Tab>
                                    <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>History</Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel value="conversation" p="lg">
                                    <Stack gap={14} mb="lg">
                                        {messages.length === 0 ? (
                                            <Text size="sm" c={T.inkFaint} ta="center" py="xl">
                                                No replies yet. Start the conversation below.
                                            </Text>
                                        ) : (
                                            messages.map((m) => {
                                                const isInternal = m.type === "internal_note";
                                                const barColor = isInternal ? T.note : T.accent;
                                                return (
                                                    <Box
                                                        key={m._id}
                                                        p="md"
                                                        style={{
                                                            background: isInternal ? (isDark ? "rgba(138,109,29,0.10)" : "#FBF7EC") : (isDark ? "#1D2024" : "#F7F7F5"),
                                                            border: `1px solid ${T.line}`,
                                                            borderLeft: `3px solid ${barColor}`,
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        <Group justify="space-between" mb={6}>
                                                            <Group gap={8}>
                                                                <Avatar size={22} radius="xl" color={isInternal ? "yellow" : "dark"}>
                                                                    {m.author?.name?.charAt(0)?.toUpperCase()}
                                                                </Avatar>
                                                                <Text size="sm" fw={700} c={T.ink}>{m.author?.name}</Text>
                                                                {isInternal && (
                                                                    <Text size="xs" fw={700} c={T.note}>Internal note</Text>
                                                                )}
                                                            </Group>
                                                            <Text size="xs" c={T.inkFaint} style={{ fontFamily: T.mono }}>
                                                                {new Date(m.createdAt).toLocaleString()}
                                                            </Text>
                                                        </Group>
                                                        <Text size="sm" c={T.ink} style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                                                            {m.body}
                                                        </Text>
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </Stack>

                                    <Divider color={T.line} mb="md" />

                                    <Stack gap={10}>
                                        <Group gap={8}>
                                            {[
                                                { key: "reply", label: "Reply to customer" },
                                                { key: "internal_note", label: "Internal note" },
                                            ].map((opt) => {
                                                const active = replyKind === opt.key;
                                                const color = opt.key === "internal_note" ? T.note : T.accent;
                                                return (
                                                    <Box
                                                        key={opt.key}
                                                        onClick={() => setReplyKind(opt.key)}
                                                        style={{
                                                            cursor: "pointer", fontSize: 12, fontWeight: 700,
                                                            padding: "6px 12px", borderRadius: 20,
                                                            border: `1px solid ${active ? color : T.line}`,
                                                            color: active ? "#fff" : T.inkMuted,
                                                            background: active ? color : "transparent",
                                                            transition: "all .15s ease",
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </Box>
                                                );
                                            })}
                                        </Group>
                                        <Textarea
                                            placeholder={replyKind === "reply" ? "Write a reply the customer will see…" : "Leave a note for the team — the customer won't see this…"}
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            autosize
                                            minRows={3}
                                            radius="sm"
                                        />
                                        <Group justify="flex-end">
                                            <Button
                                                size="sm"
                                                radius="sm"
                                                loading={submittingReply}
                                                onClick={handleSendReply}
                                                disabled={!replyBody.trim()}
                                                color={replyKind === "internal_note" ? "yellow" : "dark"}
                                                rightSection={<IconSend size={13} />}
                                            >
                                                {replyKind === "reply" ? "Send reply" : "Add note"}
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Tabs.Panel>

                                <Tabs.Panel value="history" p="lg">
                                    <Stack gap={16}>
                                        {timeline.length === 0 ? (
                                            <Text size="sm" c={T.inkFaint} ta="center" py="xl">
                                                No activity recorded yet.
                                            </Text>
                                        ) : (
                                            timeline.map((event) => (
                                                <Group key={event._id} gap={12} align="flex-start" wrap="nowrap">
                                                    <Box style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, marginTop: 7, flexShrink: 0 }} />
                                                    <Box>
                                                        <Text size="sm" c={T.ink} style={{ lineHeight: 1.4 }}>{TIMELINE_LABEL(event)}</Text>
                                                        <Text size="xs" c={T.inkFaint} style={{ fontFamily: T.mono }}>
                                                            {new Date(event.createdAt).toLocaleString()}
                                                        </Text>
                                                    </Box>
                                                </Group>
                                            ))
                                        )}
                                    </Stack>
                                </Tabs.Panel>
                            </Tabs>
                        </Paper>
                    </Stack>

                    {/* Sidebar — each functionality its own clearly bounded card */}
                    <Stack gap="md" style={{ position: "sticky", top: 20 }}>
                        <Paper style={cardStyle} p="lg">
                            <ChipHeader icon={IconClock} label="Response time" color={T.accent} />
                            <SlaTimer ticket={ticket} />
                            <Text size="xs" c={T.inkFaint} mt={8} style={{ fontFamily: T.mono }}>
                                target {ticket.slaTargetMinutes}m
                            </Text>

                            {availableTransitions.length > 0 && (
                                <>
                                    <Divider color={T.line} my="md" />
                                    <Stack gap={8}>
                                        {availableTransitions.map((target) => {
                                            const closing = target === "closed";
                                            return (
                                                <Button
                                                    key={target}
                                                    size="sm"
                                                    radius="sm"
                                                    variant={closing ? "filled" : "default"}
                                                    color={closing ? "red" : "dark"}
                                                    onClick={() => handleTransition(target)}
                                                    fullWidth
                                                >
                                                    {ACTION_LABEL[`${ticket.status}>${target}`] || `Move to ${target}`}
                                                </Button>
                                            );
                                        })}
                                    </Stack>
                                </>
                            )}
                        </Paper>

                        <Paper style={cardStyle} p="lg">
                            <ChipHeader icon={IconUserCheck} label="Assignee" color={T.accent} />
                            <Group gap={8}>
                                <Avatar size={30} radius="xl" color="dark">
                                    {ticket.primaryAssignee?.name?.charAt(0)?.toUpperCase() || "?"}
                                </Avatar>
                                <Text size="sm" fw={600} c={T.ink}>
                                    {ticket.primaryAssignee?.name || "Unassigned"}
                                </Text>
                            </Group>

                            {canReassign && (
                                <Group gap={8} wrap="nowrap" mt="md">
                                    <Select
                                        placeholder="Reassign to…"
                                        data={reassignOptions}
                                        value={reassignTarget}
                                        onChange={setReassignTarget}
                                        size="sm"
                                        radius="sm"
                                        style={{ flex: 1 }}
                                        searchable
                                    />
                                    <Button size="sm" radius="sm" variant="default" onClick={handleReassign} disabled={!reassignTarget}>
                                        Move
                                    </Button>
                                </Group>
                            )}
                        </Paper>

                        <Paper style={cardStyle} p="lg">
                            <ChipHeader icon={IconUsersGroup} label="Collaborators" color={T.accent} />
                            <Stack gap={10} mb={canManageCollaborators ? "md" : 0}>
                                {(ticket.collaborators || []).length === 0 && (
                                    <Text size="sm" c={T.inkFaint}>No collaborators attached.</Text>
                                )}
                                {(ticket.collaborators || []).map((c) => (
                                    <Group key={c._id} justify="space-between">
                                        <Group gap={8}>
                                            <Avatar size={22} radius="xl" color="gray">
                                                {c.name?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Text size="sm" c={T.ink}>{c.name}</Text>
                                        </Group>
                                        {canManageCollaborators && (
                                            <ActionIcon size="sm" variant="subtle" color="red" radius="sm" aria-label={`Remove ${c.name}`} onClick={() => handleRemoveCollaborator(c._id)}>
                                                <IconX size={13} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                ))}
                            </Stack>

                            {canManageCollaborators && (
                                <Group gap={8} wrap="nowrap">
                                    <Select
                                        placeholder="Add collaborator…"
                                        data={collaboratorOptions}
                                        value={collaboratorTarget}
                                        onChange={setCollaboratorTarget}
                                        size="sm"
                                        radius="sm"
                                        style={{ flex: 1 }}
                                        searchable
                                    />
                                    <ActionIcon
                                        size="lg"
                                        variant="filled"
                                        color="dark"
                                        radius="sm"
                                        aria-label="Add collaborator"
                                        onClick={handleAddCollaborator}
                                        disabled={!collaboratorTarget}
                                    >
                                        <IconUserPlus size={15} />
                                    </ActionIcon>
                                </Group>
                            )}
                        </Paper>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}