import { useEffect, useState } from "react";
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
    SegmentedControl,
    useMantineColorScheme,
    Container,
    Stack,
    Box,
    ThemeIcon
} from "@mantine/core";
import { 
    IconSearch, 
    IconDownload, 
    IconUsersGroup, 
    IconX, 
    IconArchiveOff,
    IconInbox,
    IconPlus
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
    fetchTickets,
    fetchAgents,
    bulkReassign,
    bulkClose,
    exportTicketsCsv,
    restoreTicket,
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
    const [bulkTarget, setBulkTarget] = useState(null);
    
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    const { tickets, filters, pagination, selectedTicketIds, agents, loading } = useSelector(
        (state) => state.ticket
    );
    const { user } = useSelector((state) => state.auth);

    const isArchivedView = filters.archived === "true";

    useEffect(() => {
        dispatch(fetchTickets());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.page]);

    useEffect(() => {
        dispatch(fetchAgents());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (key) => (value) => {
        dispatch(setFilters({ [key]: value || "" }));
    };

    const handleSearch = (e) => {
        dispatch(setFilters({ q: e.target.value }));
    };

    const handleViewChange = (value) => {
        dispatch(setFilters({ archived: value }));
        dispatch(clearSelectedTickets());
    };

    const validTickets = tickets.filter((t) => t._id || t.id);
    const allOnPageSelected =
        validTickets.length > 0 && validTickets.every((t) => selectedTicketIds.includes(t._id || t.id));

    const handleSelectAll = () => {
        if (allOnPageSelected) dispatch(clearSelectedTickets());
        else dispatch(selectAllTickets());
    };

    const handleBulkReassign = async () => {
        if (!bulkTarget) return;
        const res = await dispatch(bulkReassign(selectedTicketIds, bulkTarget));
        if (res.success) {
            const failed = res.results.filter((r) => !r.success);
            notifications.show({
                title: "Bulk reassign complete",
                message: failed.length
                    ? `${res.results.length - failed.length} succeeded. Refused: ${failed.map((f) => f.reason).join("; ")}`
                    : `All ${res.results.length} tickets reassigned.`,
                color: failed.length ? "orange" : "teal",
                autoClose: failed.length ? 8000 : 4000,
            });
            setBulkTarget(null);
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

    const handleRestore = async (ticketId) => {
        const res = await dispatch(restoreTicket(ticketId));
        if (res.success) {
            notifications.show({
                title: "Restored",
                message: "Ticket is back in the active queue.",
                color: "teal",
            });
            dispatch(fetchTickets());
        } else {
            notifications.show({ title: "Couldn't restore", message: res.message, color: "red" });
        }
    };

    // Animation variants for Framer Motion
    const tableRowVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.03, duration: 0.3, ease: "easeOut" }
        })
    };

    return (
        <Container size="xl" py="xl" style={{ fontFamily: "Inter, sans-serif" }}>
            <Stack gap="lg">
                {/* Header Section */}
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Text 
                            size="h2" 
                            fw={800} 
                            variant="gradient"
                            gradient={{ from: isDark ? 'gray.4' : 'dark.9', to: isDark ? 'gray.6' : 'gray.7', deg: 45 }}
                            style={{ letterSpacing: "-0.5px" }}
                        >
                            Support Tickets
                        </Text>
                        <Text size="sm" c="dimmed" mt={4} fw={500}>
                            {pagination.total} matching {user?.role === "agent" ? "assigned to you" : "in queue"}
                            {isArchivedView && (
                                <Badge size="xs" color="gray" variant="light" ml="xs">Archived</Badge>
                            )}
                        </Text>
                    </div>

                    <Group gap="sm">
                        <SegmentedControl
                            size="sm"
                            radius="md"
                            value={filters.archived}
                            onChange={handleViewChange}
                            data={[
                                { label: "Active", value: "false" },
                                { label: "Archived", value: "true" },
                            ]}
                            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : undefined }}
                        />
                        <Button
                            variant="default"
                            radius="md"
                            leftSection={<IconDownload size={16} stroke={1.5} />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                        <Button 
                            color={isDark ? "blue" : "dark"} 
                            radius="md"
                            leftSection={<IconPlus size={16} stroke={2} />}
                            onClick={() => navigate("/tickets/new")}
                            style={{ boxShadow: isDark ? "none" : "0 4px 14px 0 rgba(0,0,0,0.15)" }}
                        >
                            New Ticket
                        </Button>
                    </Group>
                </Group>

                {/* Filter Toolbar */}
                <Paper
                    withBorder
                    radius="md"
                    p="md"
                    shadow="xs"
                    style={{ backgroundColor: isDark ? "#1A1B1E" : "#FFFFFF" }}
                >
                    <Group gap="md" wrap="wrap">
                        <TextInput
                            placeholder="Search subjects..."
                            leftSection={<IconSearch size={16} stroke={1.5} c="dimmed" />}
                            defaultValue={filters.q}
                            onChange={handleSearch}
                            radius="md"
                            style={{ flex: 1, minWidth: 250 }}
                        />
                        <Select
                            placeholder="Status"
                            data={STATUS_OPTIONS}
                            value={filters.status || null}
                            onChange={handleFilterChange("status")}
                            clearable
                            radius="md"
                            w={130}
                        />
                        <Select
                            placeholder="Priority"
                            data={PRIORITY_OPTIONS}
                            value={filters.priority || null}
                            onChange={handleFilterChange("priority")}
                            clearable
                            radius="md"
                            w={130}
                        />
                        <Select
                            placeholder="Category"
                            data={CATEGORY_OPTIONS}
                            value={filters.category || null}
                            onChange={handleFilterChange("category")}
                            clearable
                            radius="md"
                            w={130}
                        />
                        <Select
                            placeholder="Assignee"
                            leftSection={<IconUsersGroup size={16} stroke={1.5} c="dimmed" />}
                            data={(agents || []).map((a) => ({ value: a._id, label: a.name }))}
                            value={filters.assignee || null}
                            onChange={handleFilterChange("assignee")}
                            clearable
                            radius="md"
                            w={160}
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
                            radius="md"
                            w={150}
                        />
                    </Group>
                </Paper>

                {/* Bulk Actions Floating Bar */}
                <AnimatePresence>
                    {!isArchivedView && selectedTicketIds.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, scale: 0.95 }}
                            animate={{ height: "auto", opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                        >
                            <Paper
                                withBorder
                                radius="md"
                                p="xs"
                                shadow="sm"
                                style={{
                                    background: isDark ? "#2C2E33" : "#F8F9FA",
                                    borderColor: isDark ? "#373A40" : "#E9ECEF"
                                }}
                            >
                                <Group justify="space-between" px="sm">
                                    <Group gap="sm">
                                        <Badge color="blue" variant="filled" size="lg" circle>
                                            {selectedTicketIds.length}
                                        </Badge>
                                        <Text size="sm" fw={600}>
                                            Tickets selected
                                        </Text>
                                    </Group>
                                    <Group gap="sm">
                                        <Select
                                            placeholder="Reassign to…"
                                            data={agents.map((a) => ({ value: a._id, label: a.name }))}
                                            value={bulkTarget}
                                            onChange={setBulkTarget}
                                            size="sm"
                                            radius="md"
                                            w={180}
                                        />
                                        <Button size="sm" radius="md" variant="default" onClick={handleBulkReassign} disabled={!bulkTarget}>
                                            Apply
                                        </Button>
                                        {user?.role === "supervisor" && (
                                            <Button size="sm" radius="md" variant="light" color="red" onClick={handleBulkClose}>
                                                Close Selected
                                            </Button>
                                        )}
                                        <ActionIcon variant="subtle" color="gray" onClick={() => dispatch(clearSelectedTickets())} radius="xl">
                                            <IconX size={18} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Data Table */}
                <Paper
                    withBorder
                    radius="md"
                    shadow="sm"
                    style={{ overflow: "hidden", backgroundColor: isDark ? "#1A1B1E" : "#FFFFFF" }}
                >
                    <Table verticalSpacing="md" highlightOnHover style={{ minWidth: 800 }}>
                        <Table.Thead style={{ background: isDark ? "#141517" : "#F8F9FA" }}>
                            <Table.Tr>
                                <Table.Th w={50} pl="md">
                                    {!isArchivedView && (
                                        <Checkbox 
                                            checked={allOnPageSelected} 
                                            onChange={handleSelectAll} 
                                            aria-label="Select all rows"
                                        />
                                    )}
                                </Table.Th>
                                <Table.Th w={10}></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>Subject</Text></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>Requester</Text></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>Status</Text></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>Priority</Text></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>Assignee</Text></Table.Th>
                                <Table.Th><Text size="xs" tt="uppercase" c="dimmed" fw={600}>SLA</Text></Table.Th>
                                {isArchivedView && <Table.Th w={60}></Table.Th>}
                            </Table.Tr>
                        </Table.Thead>
                        
                        <Table.Tbody>
                            {tickets.map((ticket, i) => {
                                const ticketId = ticket._id || ticket.id;

                                return (
                                    <motion.tr
                                        key={ticketId || `fallback-key-${i}`}
                                        custom={i}
                                        variants={tableRowVariants}
                                        initial="hidden"
                                        animate="visible"
                                        onClick={() => {
                                            if (ticketId) {
                                                navigate(`/tickets/${ticketId}`);
                                            } else {
                                                notifications.show({
                                                    title: "Cannot open ticket",
                                                    message: "This record is missing a valid ID.",
                                                    color: "red"
                                                });
                                            }
                                        }}
                                        style={{
                                            cursor: ticketId ? "pointer" : "not-allowed",
                                            transition: "background-color 0.15s ease",
                                        }}
                                    >
                                        <Table.Td pl="md" onClick={(e) => e.stopPropagation()}>
                                            {!isArchivedView && (
                                                <Checkbox
                                                    checked={selectedTicketIds.includes(ticketId)}
                                                    onChange={() => dispatch(toggleTicketSelected(ticketId))}
                                                    disabled={!ticketId}
                                                    aria-label="Select row"
                                                />
                                            )}
                                        </Table.Td>
                                        <Table.Td p={0}>
                                            <Box w={4} h={24} style={{ borderRadius: 4 }}><PriorityBar priority={ticket.priority} /></Box>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={600} lineClamp={1} style={{ color: isDark ? "#E9ECEF" : "#212529" }}>
                                                {ticket.subject || "No subject provided"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed" fw={500}>
                                                {ticket.requester?.name || "Unknown"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <StatusPill status={ticket.status} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="dot" color="gray" style={{ textTransform: "capitalize", fontWeight: 600 }}>
                                                {ticket.priority || "None"}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" wrap="nowrap">
                                                <IconUsersGroup size={14} stroke={1.5} color={isDark ? "#868E96" : "#ADB5BD"} />
                                                <Text size="sm" c="dimmed">
                                                    {ticket.primaryAssignee?.name || "Unassigned"}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <SlaTimer ticket={ticket} />
                                        </Table.Td>
                                        {isArchivedView && (
                                            <Table.Td onClick={(e) => e.stopPropagation()}>
                                                <ActionIcon
                                                    variant="light"
                                                    color="teal"
                                                    radius="md"
                                                    onClick={() => handleRestore(ticketId)}
                                                    disabled={!ticketId}
                                                    title="Restore to active queue"
                                                >
                                                    <IconArchiveOff size={16} stroke={1.5} />
                                                </ActionIcon>
                                            </Table.Td>
                                        )}
                                    </motion.tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>

                    {/* Enhanced Empty State */}
                    {!loading && tickets.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Box py={80} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <ThemeIcon size={64} radius="100%" variant="light" color={isDark ? "dark.4" : "gray.2"} mb="md">
                                    <IconInbox size={32} stroke={1.5} color={isDark ? "#868E96" : "#ADB5BD"} />
                                </ThemeIcon>
                                <Text size="lg" fw={600} c={isDark ? "gray.4" : "dark.7"}>
                                    {isArchivedView ? "No archived tickets found" : "Inbox zero!"}
                                </Text>
                                <Text c="dimmed" size="sm" mt={4} maw={300}>
                                    {isArchivedView 
                                        ? "Tickets you archive will appear here." 
                                        : "There are currently no tickets matching your active filters. Try adjusting your search."}
                                </Text>
                            </Box>
                        </motion.div>
                    )}
                </Paper>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Group justify="center" mt="md">
                        <Pagination
                            total={pagination.totalPages}
                            value={pagination.page}
                            onChange={(page) => dispatch(setPagination({ page }))}
                            radius="md"
                            color={isDark ? "blue" : "dark"}
                            withEdges
                        />
                    </Group>
                )}
            </Stack>
        </Container>
    );
}

export default TicketList;