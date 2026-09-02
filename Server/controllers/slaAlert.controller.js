import SLAAlert from "../models/slaAlert.model.js";
import Ticket from "../models/ticket.model.js";

export const listAlerts = async (req, res) => {
  const alertFilter = { acknowledged: false };

  if (req.user.role === "agent") {
    const myTickets = await Ticket.find({ primaryAssignee: req.user._id }, "_id");
    alertFilter.ticket = { $in: myTickets.map((t) => t._id) };
  }

  const alerts = await SLAAlert.find(alertFilter).populate("ticket", "subject status priority").sort({ createdAt: -1 });
  return res.status(200).json({ success: true, alerts, count: alerts.length });
};

export const acknowledgeAlert = async (req, res) => {
  const alert = await SLAAlert.findById(req.params.id).populate("ticket");
  if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

  if (req.user.role === "agent" && alert.ticket.primaryAssignee?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only acknowledge alerts on tickets assigned to you" });
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = req.user._id;
  alert.acknowledgedAt = new Date();
  await alert.save();

  return res.status(200).json({ success: true, alert });
};