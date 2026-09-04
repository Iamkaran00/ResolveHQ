// src/pages/TicketList.jsx

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    TextInput,
    Select,
    Table,
    Checkbox,
    Pagination,
    Button,
    Group,
    Text,
    Paper,
    ActionIcon,
    Badge,
} from "@mantine/core";
import { IconSearch, IconDownload, IconUsersGroup, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
    fetchTickets,
    fetchAgents,
    bulkReassign,
    bulkClose,
    exportTicketsCsv,
} from "../redux/operations/ticketOperations";
import {
    setFilters,
    setPagination,
    toggleTicketSelected,
    selectAllTickets,
    clearSelectedTickets,
} from "../redux/slices/ticketSlice";

import SlaTimer from "../components/SlaTime";
import PriorityBar from "../components/PriorityBar";
import StatusPill from "../components/StatusPill";

const STATUS_OPTIONS = ["new", "open", "pending", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const CATEGORY_OPTIONS = ["billing", "technical", "account", "general"];

function TicketList() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { tickets, filters, pagination, selectedTicketIds, agents, loading } = useSelector(
        (state) => state.ticket
    );
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchTickets());
        dispatch(fetchAgents());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.page]);

    const handleFilterChange = (key) => (value) => {
        dispatch(setFilters({ [key]: value || "" }));
    };

    const handleSearch = (e) => {
        dispatch(setFilters({ q: e.target.value }));
    };

    const allOnPageSelected =
        tickets.length > 0 && tickets.every((t) => selectedTicketIds.includes(t._id));

    const handleSelectAll = () => {
        if (allOnPageSelected) dispatch(clearSelectedTickets());
        else dispatch(selectAllTickets());
    };

    const handleBulkReassign = async () => {
        if (!agents.length) return;
        const targetAgentId = agents[0]._id; // simple v1: reassign to first agent; swap for a picker if needed
        const res = await dispatch(bulkReassign(selectedTicketIds, targetAgentId));
        if (res.success) {
            const succeeded = res.results.filter((r) => r.success).length;
            const failed = res.results.length - succeeded;
            notifications.show({
                title: "Bulk reassign complete",
                message: `${succeeded} succeeded, ${failed} refused`,
                color: failed > 0 ? "orange" : "teal",
            });
            dispatch(fetchTickets());
        }
    };

    const handleBulkClose = async () => {
        const res = await dispatch(bulkClose(selectedTicketIds));
        if (res.success) {
            const succeeded = res.results.filter((r) => r.success).length;
            const failed = res.results.length - succeeded;
            notifications.show({
                title: "Bulk close complete",
                message: `${succeeded} succeeded, ${failed} refused`,
                color: failed > 0 ? "orange" : "teal",
            });
            dispatch(fetchTickets());
        }
    };

    const handleExport = () => dispatch(exportTicketsCsv());

    return (
        <div style={{ padding: "24px 32px", maxWidth: 1280, margin: "0 auto" }}>
            <Group justify="space-between" mb="lg">
                <div>
                    <Text size="xl" fw={700} c="#0F1115">
                        Tickets
                    </Text>
                    <Text size="sm" c="dimmed">
                        {pagination.total} matching {user?.role === "agent" ? "assigned to you" : "in queue"}
                    </Text>
                </div>
                <Button
                    variant="light"
                    color="dark"
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExport}
                >
                    Export CSV
                </Button>
            </Group>

            {/* Filter bar */}
            <Paper withBorder radius="md" p="sm" mb="md">
                <Group gap="xs" wrap="wrap">
                    <TextInput
                        placeholder="Search subject or description"
                        leftSection={<IconSearch size={14} />}
                        defaultValue={filters.q}
                        onChange={handleSearch}
                        style={{ flex: 1, minWidth: 220 }}
                    />
                    <Select
                        placeholder="Status"
                        data={STATUS_OPTIONS}
                        value={filters.status || null}
                        onChange={handleFilterChange("status")}
                        clearable
                        w={140}
                    />
                    <Select
                        placeholder="Priority"
                        data={PRIORITY_OPTIONS}
                        value={filters.priority || null}
                        onChange={handleFilterChange("priority")}
                        clearable
                        w={140}
                    />
                    <Select
                        placeholder="Category"
                        data={CATEGORY_OPTIONS}
                        value={filters.category || null}
                        onChange={handleFilterChange("category")}
                        clearable
                        w={140}
                    />
                    <Select
                        placeholder="Sort by"
                        data={[
                            { value: "createdAt", label: "Created date" },
                            { value: "priority", label: "Priority" },
                            { value: "updatedAt", label: "Last update" },
                        ]}
                        value={filters.sortBy}
                        onChange={(v) => dispatch(setFilters({ sortBy: v }))}
                        w={150}
                    />
                </Group>
            </Paper>

            {/* Bulk action bar — only appears when something is selected */}
            <AnimatePresence>
                {selectedTicketIds.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                    >
                        <Paper withBorder radius="md" p="sm" mb="md" style={{ background: "#0F1115" }}>
                            <Group justify="space-between">
                                <Text size="sm" c="white" fw={600}>
                                    {selectedTicketIds.length} selected
                                </Text>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant="white"
                                        leftSection={<IconUsersGroup size={14} />}
                                        onClick={handleBulkReassign}
                                    >
                                        Reassign
                                    </Button>
                                    {user?.role === "supervisor" && (
                                        <Button size="xs" variant="filled" color="red" onClick={handleBulkClose}>
                                            Close selected
                                        </Button>
                                    )}
                                    <ActionIcon variant="subtle" color="gray" onClick={() => dispatch(clearSelectedTickets())}>
                                        <IconX size={16} color="white" />
                                    </ActionIcon>
                                </Group>
                            </Group>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
                <Table verticalSpacing="sm" highlightOnHover>
                    <Table.Thead style={{ background: "#FAFAF9" }}>
                        <Table.Tr>
                            <Table.Th w={40}>
                                <Checkbox checked={allOnPageSelected} onChange={handleSelectAll} />
                            </Table.Th>
                            <Table.Th w={4}></Table.Th>
                            <Table.Th>Subject</Table.Th>
                            <Table.Th>Requester</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Priority</Table.Th>
                            <Table.Th>Assignee</Table.Th>
                            <Table.Th>SLA</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {tickets.map((ticket, i) => (
                            <motion.tr
                                key={ticket._id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.015, duration: 0.2 }}
                                onClick={() => navigate(`/tickets/${ticket._id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <Table.Td onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedTicketIds.includes(ticket._id)}
                                        onChange={() => dispatch(toggleTicketSelected(ticket._id))}
                                    />
                                </Table.Td>
                                <Table.Td style={{ padding: 0 }}>
                                    <PriorityBar priority={ticket.priority} />
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" fw={500} lineClamp={1}>
                                        {ticket.subject}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">
                                        {ticket.requester?.name}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <StatusPill status={ticket.status} />
                                </Table.Td>
                                <Table.Td>
                                    <Badge size="sm" variant="outline" color="gray" style={{ textTransform: "capitalize" }}>
                                        {ticket.priority}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">
                                        {ticket.primaryAssignee?.name || "Unassigned"}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <SlaTimer ticket={ticket} />
                                </Table.Td>
                            </motion.tr>
                        ))}
                    </Table.Tbody>
                </Table>

                {!loading && tickets.length === 0 && (
                    <div style={{ padding: 48, textAlign: "center" }}>
                        <Text c="dimmed" size="sm">
                            No tickets match your filters.
                        </Text>
                    </div>
                )}
            </Paper>

            {pagination.totalPages > 1 && (
                <Group justify="center" mt="lg">
                    <Pagination
                        total={pagination.totalPages}
                        value={pagination.page}
                        onChange={(page) => dispatch(setPagination({ page }))}
                        color="dark"
                    />
                </Group>
            )}
        </div>
    );
}

export default TicketList;