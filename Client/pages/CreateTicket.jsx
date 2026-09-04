// src/pages/CreateTicket.jsx

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    TextInput,
    Textarea,
    Select,
    Button,
    Paper,
    Title,
    Text,
    Group,
    Alert,
} from "@mantine/core";
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { createTicket, fetchAgents } from "../redux/operations/ticketOperations";

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const CATEGORY_OPTIONS = ["billing", "technical", "account", "general"];

function CreateTicket() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { agents, loading } = useSelector((state) => state.ticket);
    const { user } = useSelector((state) => state.auth);
    const isSupervisor = user?.role === "supervisor";

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            subject: "",
            description: "",
            requesterName: "",
            requesterEmail: "",
            priority: "medium",
            category: "general",
            primaryAssignee: "", // '' = unassigned
        },
    });

    // supervisors pick freely from the full agent list — agents get only "assign to me" / "leave unassigned",
    // matching the same rule the backend enforces on POST /tickets
    useEffect(() => {
        if (isSupervisor) dispatch(fetchAgents());
    }, [isSupervisor, dispatch]);

    const primaryAssignee = watch("primaryAssignee");

    const onSubmit = async (data) => {
        const payload = {
            subject: data.subject,
            description: data.description,
            requester: { name: data.requesterName, email: data.requesterEmail },
            priority: data.priority,
            category: data.category,
            primaryAssignee: data.primaryAssignee || null,
        };

        const res = await dispatch(createTicket(payload));
        if (res.success) {
            notifications.show({ title: "Ticket created", message: "", color: "teal" });
            navigate(`/tickets/${res.ticket._id}`);
        } else {
            notifications.show({ title: "Couldn't create ticket", message: res.message, color: "red" });
        }
    };

    return (
        <div style={{ padding: "24px 32px", maxWidth: 640, margin: "0 auto" }}>
            <Button
                variant="subtle"
                color="gray"
                size="sm"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate("/tickets")}
                mb="md"
                style={{ paddingLeft: 4 }}
            >
                Back to queue
            </Button>

            <Paper withBorder shadow="sm" radius="md" p="xl">
                <Title order={2} fw={600} mb={4}>
                    New ticket
                </Title>
                <Text size="sm" c="dimmed" mb="lg">
                    Log a request on behalf of a customer.
                </Text>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextInput
                        label="Subject"
                        error={errors.subject?.message}
                        mb="sm"
                        {...register("subject", { required: "Subject is required" })}
                    />

                    <Textarea
                        label="Description"
                        autosize
                        minRows={3}
                        error={errors.description?.message}
                        mb="sm"
                        {...register("description", { required: "Description is required" })}
                    />

                    <Group grow mb="sm">
                        <TextInput
                            label="Requester name"
                            error={errors.requesterName?.message}
                            {...register("requesterName", { required: "Requester name is required" })}
                        />
                        <TextInput
                            label="Requester email"
                            type="email"
                            error={errors.requesterEmail?.message}
                            {...register("requesterEmail", {
                                required: "Requester email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Enter a valid email",
                                },
                            })}
                        />
                    </Group>

                    <Group grow mb="sm">
                        <Select
                            label="Priority"
                            data={PRIORITY_OPTIONS}
                            value={watch("priority")}
                            onChange={(v) => setValue("priority", v)}
                        />
                        <Select
                            label="Category"
                            data={CATEGORY_OPTIONS}
                            value={watch("category")}
                            onChange={(v) => setValue("category", v)}
                        />
                    </Group>

                    {isSupervisor ? (
                        <Select
                            label="Assign to"
                            placeholder="Leave unassigned"
                            data={(agents || []).map((a) => ({ value: a._id, label: `${a.name} (${a.email})` }))}
                            value={primaryAssignee || null}
                            onChange={(v) => setValue("primaryAssignee", v || "")}
                            clearable
                            searchable
                            mb="md"
                        />
                    ) : (
                        <Select
                            label="Assign to"
                            data={[{ value: user.id, label: `${user.name} (me)` }]}
                            placeholder="Leave unassigned"
                            value={primaryAssignee || null}
                            onChange={(v) => setValue("primaryAssignee", v || "")}
                            clearable
                            mb="md"
                        />
                    )}

                    <Group justify="flex-end">
                        <Button type="submit" loading={loading} color="dark">
                            Create ticket
                        </Button>
                    </Group>
                </form>
            </Paper>
        </div>
    );
}

export default CreateTicket;