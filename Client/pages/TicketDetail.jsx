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
    SegmentedControl,
    useMantineColorScheme,
    Skeleton,
    Badge,
    Tooltip,
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
    IconLock,
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
            <Box style={{ maxWidth: 1200, margin: "0 auto" }} p="xl">
                <Skeleton height={24} width={140} mb="xl" radius="sm" />
                <Skeleton height={160} radius="lg" mb="md" />
                <Skeleton height={350} radius="lg" />
            </Box>
        );
    }

    if (!ticket) return null;

    return (
        <Box
            style={{
                maxWidth: 1200,
                margin: "0 auto",
                minHeight: "100vh",
            }}
            p={{ base: "md", sm: "xl" }}
        >
            {/* Top Navigation Bar */}
            <Group justify="space-between" align="center" mb="lg">
                <Button
                    variant="subtle"
                    color="gray"
                    size="sm"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => navigate(-1)}
                    style={{ borderRadius: "8px" }}
                >
                    Back to queue
                </Button>

                <Button
                    variant={ticket.archived ? "light" : "outline"}
                    color={ticket.archived ? "teal" : "gray"}
                    size="xs"
                    radius="md"
                    leftSection={ticket.archived ? <IconArchiveOff size={14} /> : <IconArchive size={14} />}
                    onClick={handleArchiveToggle}
                >
                    {ticket.archived ? "Restore Ticket" : "Archive Ticket"}
                </Button>
            </Group>

            {/* Layout Grid */}
            <Box
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr minmax(280px, 320px)",
                    gap: "24px",
                    alignItems: "start",
                }}
            >
                {/* Main Content Pane */}
                <Stack gap="lg">
                    {/* Ticket Overview Card */}
                    <Paper
                        withBorder
                        radius="lg"
                        style={{
                            overflow: "hidden",
                            borderColor: isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-2)",
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Box style={{ display: "flex", minHeight: "100%" }}>
                            <PriorityBar priority={ticket.priority} />
                            <Box style={{ flex: 1 }} p="lg">
                                <Group justify="space-between" align="flex-start" mb="xs">
                                    {editingFields ? (
                                        <TextInput
                                            value={draft.subject}
                                            onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                                            style={{ flex: 1 }}
                                            size="sm"
                                            variant="filled"
                                            radius="md"
                                        />
                                    ) : (
                                        <Text size="xl" fw={700} style={{ lineHeight: 1.3 }}>
                                            {ticket.subject}
                                        </Text>
                                    )}

                                    <Group gap="xs" wrap="nowrap">
                                        <StatusPill status={ticket.status} />
                                        {editingFields ? (
                                            <Group gap={4}>
                                                <ActionIcon size="sm" variant="light" color="teal" radius="md" onClick={handleSaveFields}>
                                                    <IconCheck size={14} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    size="sm"
                                                    variant="light"
                                                    color="gray"
                                                    radius="md"
                                                    onClick={() => {
                                                        setEditingFields(false);
                                                        setDraft({ subject: ticket.subject, description: ticket.description });
                                                    }}
                                                >
                                                    <IconX size={14} />
                                                </ActionIcon>
                                            </Group>
                                        ) : (
                                            <ActionIcon size="sm" variant="subtle" color="gray" radius="md" onClick={() => setEditingFields(true)}>
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
                                        variant="filled"
                                        radius="md"
                                        mt="xs"
                                    />
                                ) : (
                                    <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }} mt="xs">
                                        {ticket.description}
                                    </Text>
                                )}

                                <Group gap="md" mt="md" pt="sm" style={{ borderTop: `1px solid ${isDark ? "var(--mantine-color-dark-5)" : "var(--mantine-color-gray-1)"}` }}>
                                    <Group gap="xs">
                                        <Avatar size="xs" radius="xl" color="blue">
                                            {ticket.requester?.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Text size="xs" fw={500}>
                                            {ticket.requester?.name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            ({ticket.requester?.email})
                                        </Text>
                                    </Group>
                                    <Badge variant="dot" size="sm" color="gray" tt="capitalize">
                                        {ticket.category}
                                    </Badge>
                                </Group>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Tabs Area: Conversation and History */}
                    <Paper
                        withBorder
                        radius="lg"
                        style={{
                            borderColor: isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-2)",
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Tabs value={activeTab} onChange={setActiveTab} radius="md">
                            <Tabs.List p="xs">
                                <Tabs.Tab value="conversation" leftSection={<IconMessageCircle size={15} />}>
                                    Conversation
                                </Tabs.Tab>
                                <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>
                                    History
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="conversation" p="md">
                                <Stack gap="md" mb="xl">
                                    {messages.length === 0 ? (
                                        <Text size="sm" c="dimmed" ta="center" py="xl">
                                            No replies yet. Start the conversation below.
                                        </Text>
                                    ) : (
                                        messages.map((m) => {
                                            const isInternal = m.type === "internal_note";
                                            return (
                                                <Paper
                                                    key={m._id}
                                                    p="md"
                                                    radius="md"
                                                    style={{
                                                        backgroundColor: isInternal
                                                            ? isDark
                                                                ? "rgba(201, 162, 39, 0.08)"
                                                                : "#FFFDF5"
                                                            : isDark
                                                            ? "var(--mantine-color-dark-6)"
                                                            : "var(--mantine-color-gray-0)",
                                                        border: `1px solid ${
                                                            isInternal
                                                                ? isDark
                                                                    ? "rgba(201, 162, 39, 0.3)"
                                                                    : "#F3E8B6"
                                                                : isDark
                                                                ? "var(--mantine-color-dark-4)"
                                                                : "var(--mantine-color-gray-2)"
                                                        }`,
                                                        borderLeftWidth: "4px",
                                                        borderLeftColor: isInternal ? "var(--mantine-color-yellow-6)" : "var(--mantine-color-blue-6)",
                                                    }}
                                                >
                                                    <Group justify="space-between" mb="xs">
                                                        <Group gap="xs">
                                                            <Avatar size={22} radius="xl" color={isInternal ? "yellow" : "blue"}>
                                                                {m.author?.name?.charAt(0)?.toUpperCase()}
                                                            </Avatar>
                                                            <Text size="xs" fw={600}>
                                                                {m.author?.name}
                                                            </Text>
                                                            {isInternal && (
                                                                <Badge size="xs" variant="light" color="yellow" leftSection={<IconLock size={10} />}>
                                                                    Internal Note
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Text size="10px" c="dimmed">
                                                            {new Date(m.createdAt).toLocaleString()}
                                                        </Text>
                                                    </Group>
                                                    <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                                        {m.body}
                                                    </Text>
                                                </Paper>
                                            );
                                        })
                                    )}
                                </Stack>

                                <Divider mb="md" />

                                {/* Reply Input Area */}
                                <Stack gap="xs">
                                    <SegmentedControl
                                        size="xs"
                                        radius="md"
                                        value={replyKind}
                                        onChange={setReplyKind}
                                        data={[
                                            { label: "Customer-visible reply", value: "reply" },
                                            { label: "Internal note", value: "internal_note" },
                                        ]}
                                        style={{ alignSelf: "flex-start" }}
                                    />
                                    <Textarea
                                        placeholder={
                                            replyKind === "reply" ? "Write a reply the customer will see…" : "Leave an internal note for the team…"
                                        }
                                        value={replyBody}
                                        onChange={(e) => setReplyBody(e.target.value)}
                                        autosize
                                        minRows={3}
                                        radius="md"
                                    />
                                    <Group justify="flex-end">
                                        <Button
                                            size="xs"
                                            radius="md"
                                            loading={submittingReply}
                                            onClick={handleSendReply}
                                            disabled={!replyBody.trim()}
                                            color={replyKind === "internal_note" ? "yellow" : "blue"}
                                            rightSection={<IconSend size={12} />}
                                        >
                                            {replyKind === "reply" ? "Send Reply" : "Add Note"}
                                        </Button>
                                    </Group>
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="history" p="md">
                                <Stack gap="sm">
                                    {timeline.length === 0 ? (
                                        <Text size="sm" c="dimmed" ta="center" py="xl">
                                            No activity recorded yet.
                                        </Text>
                                    ) : (
                                        timeline.map((event) => (
                                            <Group key={event._id} gap="xs" align="flex-start" wrap="nowrap">
                                                <Box
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        backgroundColor: "var(--mantine-color-blue-5)",
                                                        marginTop: 6,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <Box>
                                                    <Text size="sm" style={{ lineHeight: 1.4 }}>
                                                        {TIMELINE_LABEL(event)}
                                                    </Text>
                                                    <Text size="10px" c="dimmed">
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

                {/* Control Sidebar */}
                <Stack gap="lg" style={{ position: "sticky", top: 20 }}>
                    {/* SLA & Actions Section */}
                    <Paper
                        withBorder
                        radius="lg"
                        p="md"
                        style={{
                            borderColor: isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-2)",
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                SLA Management
                            </Text>
                            <IconClock size={14} opacity={0.5} />
                        </Group>

                        <SlaTimer ticket={ticket} />

                        <Text size="xs" c="dimmed" mt={6}>
                            Target: {ticket.slaTargetMinutes} min response time
                        </Text>

                        {availableTransitions.length > 0 && (
                            <>
                                <Divider my="sm" />
                                <Stack gap="xs">
                                    {availableTransitions.map((target) => (
                                        <Button
                                            key={target}
                                            size="xs"
                                            radius="md"
                                            variant={target === "closed" ? "filled" : "light"}
                                            color={target === "closed" ? "red" : "blue"}
                                            onClick={() => handleTransition(target)}
                                            fullWidth
                                        >
                                            {ACTION_LABEL[`${ticket.status}>${target}`] || `Move to ${target}`}
                                        </Button>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Paper>

                    {/* Assignment Section */}
                    <Paper
                        withBorder
                        radius="lg"
                        p="md"
                        style={{
                            borderColor: isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-2)",
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                Primary Assignee
                            </Text>
                            <IconUserCheck size={14} opacity={0.5} />
                        </Group>

                        <Group gap="xs" mb={canReassign ? "xs" : 0}>
                            <Avatar size={24} radius="xl" color="blue">
                                {ticket.primaryAssignee?.name?.charAt(0)?.toUpperCase() || "?"}
                            </Avatar>
                            <Text size="sm" fw={500}>
                                {ticket.primaryAssignee?.name || "Unassigned"}
                            </Text>
                        </Group>

                        {canReassign && (
                            <Group gap="xs" wrap="nowrap" mt="xs">
                                <Select
                                    placeholder="Reassign to…"
                                    data={reassignOptions}
                                    value={reassignTarget}
                                    onChange={setReassignTarget}
                                    size="xs"
                                    radius="md"
                                    style={{ flex: 1 }}
                                    searchable
                                />
                                <Button size="xs" radius="md" onClick={handleReassign} disabled={!reassignTarget}>
                                    Move
                                </Button>
                            </Group>
                        )}
                    </Paper>

                    {/* Collaborators Section */}
                    <Paper
                        withBorder
                        radius="lg"
                        p="md"
                        style={{
                            borderColor: isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-2)",
                            boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                Collaborators
                            </Text>
                            <IconUsersGroup size={14} opacity={0.5} />
                        </Group>

                        <Stack gap="xs" mb={canManageCollaborators ? "xs" : 0}>
                            {(ticket.collaborators || []).length === 0 && (
                                <Text size="xs" c="dimmed">
                                    No collaborators attached.
                                </Text>
                            )}
                            {(ticket.collaborators || []).map((c) => (
                                <Group key={c._id} justify="space-between">
                                    <Group gap="xs">
                                        <Avatar size={20} radius="xl" color="gray">
                                            {c.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Text size="xs" fw={500}>
                                            {c.name}
                                        </Text>
                                    </Group>
                                    {canManageCollaborators && (
                                        <ActionIcon
                                            size="xs"
                                            variant="subtle"
                                            color="red"
                                            radius="md"
                                            onClick={() => handleRemoveCollaborator(c._id)}
                                        >
                                            <IconX size={12} />
                                        </ActionIcon>
                                    )}
                                </Group>
                            ))}
                        </Stack>

                        {canManageCollaborators && (
                            <Group gap="xs" wrap="nowrap" mt="xs">
                                <Select
                                    placeholder="Add collaborator…"
                                    data={collaboratorOptions}
                                    value={collaboratorTarget}
                                    onChange={setCollaboratorTarget}
                                    size="xs"
                                    radius="md"
                                    style={{ flex: 1 }}
                                    searchable
                                />
                                <Tooltip label="Add Collaborator">
                                    <ActionIcon
                                        size="sm"
                                        variant="filled"
                                        color="blue"
                                        radius="md"
                                        onClick={handleAddCollaborator}
                                        disabled={!collaboratorTarget}
                                    >
                                        <IconUserPlus size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        )}
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
}