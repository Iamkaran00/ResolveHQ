// src/pages/Login.jsx

import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { TextInput, PasswordInput, Button, Title, Text, Alert, Paper } from "@mantine/core";
import { IconAlertCircle, IconArrowRight } from "@tabler/icons-react";
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
    } = useForm({ defaultValues: { email: "", password: "" } });

    const onSubmit = async (data) => {
        const res = await dispatch(login(data.email, data.password));
        if (res.success) {
            notifications.show({ title: "Signed in", message: "Welcome back.", color: "teal" });
            navigate(location.state?.from?.pathname || "/tickets", { replace: true });
        }
    };

    return (
        <AuthBackground>
            <Paper radius="md" p={0}>
                <Title order={2} fw={600} mb={4}>
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