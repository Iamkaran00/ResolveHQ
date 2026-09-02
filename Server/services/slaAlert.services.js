import SLAAlert from "../models/slaAlert.model.js";
import { computeElapsedMs } from "./ticketLifecycle.service.js";
import { AT_RISK_THRESHOLD } from "../constants/ticketEnums.js";

export const evaluateTicketAlert = async (ticket) => {
  if (!["new", "open"].includes(ticket.status)) return;

  const targetMs = ticket.slaTargetMinutes * 60 * 1000;
  const elapsed = computeElapsedMs(ticket);

  let severity = null;
  if (elapsed >= targetMs) severity = "breached";
  else if (elapsed >= targetMs * AT_RISK_THRESHOLD) severity = "at_risk";
  if (!severity) return;

  const existing = await SLAAlert.findOne({ ticket: ticket._id, acknowledged: false });
  if (existing) {
    if (existing.type !== severity) { existing.type = severity; await existing.save(); }
    return;
  }
  await SLAAlert.create({ ticket: ticket._id, type: severity });
};