// src/components/AuthBackground.jsx

import { motion } from "framer-motion";
import { Text } from "@mantine/core";
import { Link } from "react-router-dom";

function OrbitMark() {
    return (
        <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
            <circle cx="110" cy="110" r="90" stroke="#2A2D34" strokeWidth="1" />
            <circle cx="110" cy="110" r="66" stroke="#2A2D34" strokeWidth="1" />
            <circle cx="110" cy="110" r="42" stroke="#3A3E47" strokeWidth="1" />
            <motion.circle
                cx="110" cy="20" r="4" fill="#C97A2B"
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "110px 110px" }}
            />
            <motion.circle
                cx="176" cy="110" r="3" fill="#5B6B8C"
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "110px 110px" }}
            />
            <circle cx="110" cy="110" r="5" fill="#F4F3F0" />
        </svg>
    );
}

function AuthBackground({ children }) {
    return (
        <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
            {/* Left — permanent brand surface, ink-dark regardless of theme */}
            <div
                style={{
                    background: "#0F1115",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "48px 56px",
                    position: "relative",
                }}
                className="auth-left-panel"
            >
                <Link to = '/' >
                <Text fw={700} size="lg" c="#F4F3F0" style={{ letterSpacing: 0.2 }}>
                    ResolveHQ
                </Text>
</Link>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ alignSelf: "center" }}
                >
                    <OrbitMark />
                </motion.div>

                <div>
                    <Text size="xl" fw={600} c="#F4F3F0" style={{ maxWidth: 360, lineHeight: 1.35 }}>
                        Every ticket runs on a clock. We just make sure nothing quietly slips past it.
                    </Text>
                    <Text size="sm" c="#8A8F99" mt={12}>
                        Support queue, SLA tracking, and reply history — in one place.
                    </Text>
                </div>
            </div>

            {/* Right — form surface, theme-aware */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }}
                className="auth-right-panel"
            >
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ width: "100%", maxWidth: 380 }}
                >
                    {children}
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 860px) {
                    .auth-left-panel { display: none; }
                }
                .auth-right-panel {
                    background: light-dark(#FAFAF9, #15171C);
                }
            `}</style>
        </div>
    );
}

export default AuthBackground;