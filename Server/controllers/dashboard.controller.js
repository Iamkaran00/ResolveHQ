import { isBreached } from "../services/ticketLifecycle.service.js";
import Ticket from "../models/ticket.model.js";
export const getDashboard = async (req, res) => {
  const baseFilter = { archived: false };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [openCount, pendingCount, resolvedThisWeek, byStatus, byAgent, resolvedPerWeek, allActive] = await Promise.all([
    Ticket.countDocuments({ ...baseFilter, status: "open" }),
    Ticket.countDocuments({ ...baseFilter, status: "pending" }),
    Ticket.countDocuments({ ...baseFilter, resolvedAt: { $gte: weekAgo } }),
    Ticket.aggregate([{ $match: baseFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: baseFilter }, { $group: { _id: "$primaryAssignee", count: { $sum: 1 } } }]),
    Ticket.aggregate([
      { $match: { ...baseFilter, resolvedAt: { $gte: eightWeeksAgo } } },
      { $group: { _id: { $isoWeek: "$resolvedAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Ticket.find({ ...baseFilter, status: { $in: ["new", "open"] } }),
  ]);

  const breaching = allActive.filter(isBreached).length;

  return res.status(200).json({
    success: true,
    headline: { open: openCount, pending: pendingCount, resolvedThisWeek, breaching },
    byStatus, byAgent, resolvedPerWeek,
  });
};