import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { TextInput, PasswordInput, Button, Title, Text, Alert, Paper, Divider, Group } from "@mantine/core";
import { IconAlertCircle, IconArrowRight, IconInfoCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { login } from "../redux/operations/authOperations";
import AuthBackground from "../components/AuthBackground";

const DEMO_ACCOUNTS = [
    { label: "Supervisor", email: "abhijeet@gmail.com", password: "abhijeet sahu" },
    { label: "Agent", email: "rahul@gmail.com", password: "rahul sahu" },
];
const SHOW_DEMO = true;

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error } = useSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({ defaultValues: { email: "", password: "" } });

    const fillDemo = (acc) => {
        setValue("email", acc.email, { shouldValidate: true });
        setValue("password", acc.password, { shouldValidate: true });
    };

    const onSubmit = async (data) => {
        const res = await dispatch(login(data.email, data.password));
        if (res.success) {
            notifications.show({ title: "Signed in", message: "Welcome back.", color: "teal" });
            navigate(location.state?.from?.pathname || "/tickets", { replace: true });
        }
    };

    return (
        <AuthBackground>
            <Paper radius="md" p={{ base: "lg", sm: "xl" }} w="100%" maw={420} mx="auto">
                <Title order={2} fw={600} mb={4} style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}>
                    Welcome back
                </Title>
                <Text size="sm" c="dimmed" mb={28}>
                    Sign in to pick up where the queue left off.
                </Text>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextInput
                        label="Email"
                        type="email"
                        autoComplete="email"
                        error={errors.email?.message}
                        mb="sm"
                        {...register("email", {
                            required: "Email is required",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                        })}
                    />
                    <PasswordInput
                        label="Password"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        mb="md"
                        {...register("password", { required: "Password is required" })}
                    />

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md">
                            {error}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        color="dark"
                        rightSection={<IconArrowRight size={15} style={{ opacity: 0.7 }} />}
                    >
                        Sign in
                    </Button>
                </form>

                {SHOW_DEMO && (
                    <>
                        <Divider label="Try a demo account" labelPosition="center" my="lg" />
                        <Group grow mb="sm">
                            {DEMO_ACCOUNTS.map((acc) => (
                                <Button key={acc.label} variant="light" color="dark" onClick={() => fillDemo(acc)}>
                                    {acc.label}
                                </Button>
                            ))}
                        </Group>
                        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" title="Why can't I pick a role?">
                            <Text size="xs">
                                Roles are assigned by the system, not chosen at login. If anyone could be a
                                supervisor, the role would protect nothing: any user could reassign tickets, run
                                bulk actions and see the audit timeline, and the audit trail couldn't be trusted.
                                Only an existing supervisor can create or promote another one.
                            </Text>
                        </Alert>
                    </>
                )}

                <Text size="sm" c="dimmed" ta="center" mt={24}>
                    No account?{" "}
                    <Text component={Link} to="/register" fw={600} c="dark" span>
                        Create one
                    </Text>
                </Text>
            </Paper>
        </AuthBackground>
    );
}

export default Login;
