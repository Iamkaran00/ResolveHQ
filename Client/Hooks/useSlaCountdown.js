import { useState, useEffect } from "react";

const RUNNING_STATES = ["new", "open"];
const AT_RISK_THRESHOLD = 0.8;

function computeElapsedMs(ticket) {
  const { accumulatedMs, runningSince } = ticket.clock;
  if (!runningSince) return accumulatedMs;
  return accumulatedMs + (Date.now() - new Date(runningSince).getTime());
}

export function useSlaCountdown(ticket) {
  const [, tick] = useState(0);
  const isRunning = RUNNING_STATES.includes(ticket.status);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const targetMs = ticket.slaTargetMinutes * 60 * 1000;
  const elapsedMs = computeElapsedMs(ticket);
  const remainingMs = targetMs - elapsedMs;
  const ratio = elapsedMs / targetMs;

  let severity = "healthy";
  if (ratio >= 1) severity = "breached";
  else if (ratio >= AT_RISK_THRESHOLD) severity = "at_risk";

  const abs = Math.abs(remainingMs);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");

  const label = isRunning
    ? `${remainingMs < 0 ? "-" : ""}${h > 0 ? `${h}:` : ""}${pad(m)}:${pad(s)}`
    : "paused";

  return { severity, label, isRunning, remainingMs };
}