import { motion } from "framer-motion";
import { Text } from "@mantine/core";
import { useSlaCountdown } from "../Hooks/useSlaCountdown";

const COLOR = { healthy: "#2F8F5B", at_risk: "#C97A2B", breached: "#9E2B3E" };

export default function SlaTimer({ ticket }) {
  const { severity, label, isRunning } = useSlaCountdown(ticket);
  const color = COLOR[severity];
  return (
    <motion.div
      animate={severity !== "healthy" && isRunning ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
      transition={severity === "breached" ? { duration: 1.1, repeat: Infinity } : severity === "at_risk" ? { duration: 2, repeat: Infinity } : { duration: 0 }}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <Text size="xs" fw={600} style={{ color, fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{label}</Text>
    </motion.div>
  );
}