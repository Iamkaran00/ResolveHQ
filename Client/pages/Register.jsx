
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { TextInput, PasswordInput, Button, Paper, Title, Text, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { signUp } from "../redux/operations/authOperations";
import AuthBackground from "../components/AuthBackground";

function Register() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    });

    const password = watch("password");

    const onSubmit = async (data) => {
        const res = await dispatch(signUp(data.name, data.email, data.password));
        if (res.success) {
            notifications.show({
                title: "Account created",
                message: "You're signed in.",
                color: "teal",
            });
            navigate("/tickets", { replace: true });
        }
    };

    return (
        <AuthBackground>
            <Paper withBorder shadow="sm" radius="md" p="xl" style={{ width: 380 }}>
                <Title order={2} fw={600} mb={4}>
                    Create account
                </Title>
                <Text size="sm" c="dimmed" mb="lg">
                    New agents join as{" "}
                    <Text span fw={600} c="dark">
                        agent
                    </Text>{" "}
                    by default
                </Text>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextInput
                        label="Name"
                        autoComplete="name"
                        error={errors.name?.message}
                        mb="sm"
                        {...register("name", {
                            required: "Name is required",
                            minLength: { value: 2, message: "Name is too short" },
                        })}
                    />

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
                        autoComplete="new-password"
                        error={errors.password?.message}
                        mb="sm"
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 6, message: "At least 6 characters" },
                        })}
                    />

                    <PasswordInput
                        label="Confirm password"
                        autoComplete="new-password"
                        error={errors.confirmPassword?.message}
                        mb="md"
                        {...register("confirmPassword", {
                            required: "Confirm your password",
                            validate: (value) => value === password || "Passwords don't match",
                        })}
                    />

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md">
                            {error}
                        </Alert>
                    )}

                    <Button type="submit" fullWidth loading={loading} color="dark">
                        Create account
                    </Button>
                </form>

                <Text size="sm" c="dimmed" ta="center" mt="lg">
                    Already have an account?{" "}
                    <Text component={Link} to="/login" fw={600} c="dark" span>
                        Sign in
                    </Text>
                </Text>
            </Paper>
        </AuthBackground>
    );
}

export default Register;