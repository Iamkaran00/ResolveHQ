import Ticket from "../models/ticket.model.js";
 
import { evaluateTicketAlert } from "../services/slaAlert.services.js";
export const startSlaSweep = (intervalMs = 60_000) => {
  setInterval(async () => {
    const active = await Ticket.find({ archived: false, status: { $in: ["new", "open"] } });
    for (const ticket of active) await evaluateTicketAlert(ticket);
  }, intervalMs);
};