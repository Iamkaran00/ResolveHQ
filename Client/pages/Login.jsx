 
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { TextInput, PasswordInput, Button, Paper, Title, Text, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { login } from "../redux/operations/authOperations";
import AuthBackground from "../components/AuthBackground";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error } = useSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data) => {
        const res = await dispatch(login(data.email, data.password));
        if (res.success) {
            notifications.show({
                title: "Signed in",
                message: "Welcome back.",
                color: "teal",
            });
            const from = location.state?.from?.pathname || "/tickets";
            navigate(from, { replace: true });
        }
        // on failure, `error` from redux state renders below via <Alert>
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#FAFAF9",
                padding: 16,
            }}
        >
        <AuthBackground/>

            <Paper withBorder shadow="sm" radius="md" p="xl" style={{ width: 380 }}>
                <Title order={2} fw={600} mb={4}>
                    Sign in
                </Title>
                <Text size="sm" c="dimmed" mb="lg">
                    Access your support queue
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
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Enter a valid email",
                            },
                        })}
                    />

                    <PasswordInput
                        label="Password"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        mb="md"
                        {...register("password", {
                            required: "Password is required",
                        })}
                    />

                    {error && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="red"
                            variant="light"
                            mb="md"
                        >
                            {error}
                        </Alert>
                    )}

                    <Button type="submit" fullWidth loading={loading} color="dark">
                        Sign in
                    </Button>
                </form>

                <Text size="sm" c="dimmed" ta="center" mt="lg">
                    No account?{" "}
                    <Text component={Link} to="/register" fw={600} c="dark" span>
                        Create one
                    </Text>
                </Text>
            </Paper>
        </div>
    );
}

export default Login;