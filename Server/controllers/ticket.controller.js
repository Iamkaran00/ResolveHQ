import Ticket from "../models/ticket.model.js";
import { CollaboratorAddedEvent, CollaboratorRemovedEvent,PriorityChangeEvent,RestoreEvent,ArchiveEvent } from "../models/timelineEvent.model.js";
import User from "../models/user.models.js";
import { AssignmentEvent } from "../models/timelineEvent.model.js";
import { changeStatus } from "../services/ticketLifecycle.service.js";
import { PRIORITIES, SLA_TARGET_MINUTES } from "../constants/ticketEnums.js";
import { TimelineEvent } from "../models/timelineEvent.model.js";

export const createTicket = async (req, res) => {
    try {
        const { subject, description, requester, priority, category, primaryAssignee, collaborators } = req.body;

        if (!subject || !description || !requester?.name || !requester?.email || !priority || !category) return res.status(400).json({ success: false, message: 'Missing required Fields' });
        if (!PRIORITIES.includes(priority)) {
            return res.status(400).json({ success: false, message: `priority must be one of ${PRIORITIES.join(", ")}` });
        }
        let finalAssignee = primaryAssignee || null ; 
        if(req.user.role === 'agent') {
          // an agent can only assign a new ticket to themselves , or leave it unassigned
          if(finalAssignee && finalAssignee !== req.user._id.toString()) {
            return res.status(403).json({success : false , message : 'Agent can only assign new tickets to themselves'}) ; 
          }
        }
        //supervisor can assign to anyone , or leave unassigned - no restriction
        const ticket = await Ticket.create({
            subject,
            description,
            requester,
            priority,
            category,
            primaryAssignee: finalAssignee,
            collaborators: collaborators || [],
            slaTargetMinutes: SLA_TARGET_MINUTES[priority],
            clock: { accumulatedMs: 0, runningSince: new Date() }
        });

        return res.status(201).json({ success: true, ticket });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed To Create Ticket', error: error.message });
    }
};

export const listTickets = async (req, res) => {
  try {
    const { q, status, priority, category, assignee, sortBy = "createdAt", sortDir = "desc", page = 1, limit = 20 } = req.query;

    const filter = { archived: false };
    const andConditions = [];

    if (req.user.role === "agent") {
      andConditions.push({ $or: [{ primaryAssignee: req.user._id }, { collaborators: req.user._id }] });
    }
    if (q) {
      andConditions.push({ $or: [{ subject: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }] });
    }
    if (andConditions.length) filter.$and = andConditions;

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignee) filter.primaryAssignee = assignee;

    const sortableFields = { createdAt: "createdAt", priority: "priority", updatedAt: "updatedAt" };
    const sortField = sortableFields[sortBy] || "createdAt";
    const sort = { [sortField]: sortDir === "asc" ? 1 : -1 };

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.min(parseInt(limit, 10), 100);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("primaryAssignee", "name email")
        .populate("collaborators", "name email")
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Ticket.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tickets,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to list tickets", error: error.message });
  }
};

export const buildTicketFilter = (req) => {
  const { q, status, priority, category, assignee } = req.query;
  const filter = { archived: false };
  const andConditions = [];

  if (req.user.role === "agent") {
    andConditions.push({ $or: [{ primaryAssignee: req.user._id }, { collaborators: req.user._id }] });
  }
  if (q) {
    andConditions.push({ $or: [{ subject: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }] });
  }
  if (andConditions.length) filter.$and = andConditions;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignee) filter.primaryAssignee = assignee;
  return filter;
};

// FIXED: was referencing an undefined `id`, had no try/catch
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.ticket._id)
      .populate("primaryAssignee", "name email")
      .populate("collaborators", "name email");
    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get ticket", error: error.message });
  }
};

export const updateTicket = async (req, res) => {
    try {
        const ticket = req.ticket;
        const { subject, description, priority, category } = req.body;
        if (priority) {
            if (!PRIORITIES.includes(priority)) {
                return res.status(400).json({ success: false, message: `priority must be one of ${PRIORITIES.join(', ')}` });
            }
            if (priority && priority !== ticket.priority) {
    await PriorityChangeEvent.create({
        ticket: ticket._id, actor: req.user._id,
        oldPriority: ticket.priority, newPriority: priority,
    });
            ticket.priority = priority;
              }  
            }
        if (subject) ticket.subject = subject;
        if (description) ticket.description = description;
        if (category) ticket.category = category;
        await ticket.save();
        return res.status(200).json({ success: true, ticket });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'failed to update ticket', error: error.message });
    }
};

export const archiveTicket = async (req, res) => {
    try {
        const ticket = req.ticket;
        if (ticket.archived) {
            return res.status(400).json({ success: false, message: "Ticket is Already archived" });
        }
        ticket.archived = true;
        await ArchiveEvent.create({ ticket: ticket._id, actor: req.user._id })
        ticket.archivedAt = new Date();
        await ticket.save();
        return res.status(200).json({ success: true, ticket });
    } catch (error) {
       return res.status(500).json({ success: false, message: 'Failed to archive ticket', error: error.message });
    }
};

export const restoreTicket = async (req, res) => {
    try {
        const ticket = req.ticket;
        if (!ticket.archived) {
            return res.status(400).json({ success: false, message: 'Ticket is Not Archived' });
        }
        ticket.archived = false;
        await RestoreEvent.create({ ticket: ticket._id, actor: req.user._id });
        ticket.archivedAt = null;
        await ticket.save();
        return res.status(200).json({ success: true, message: "Successfully Restored Ticket" });
    } catch (error) {
       return res.status(500).json({ success: false, message: 'Failed to restore ticket', error: error.message });
    }
};

export const reassignTicket = async (req, res) => {
    try {
      
        const ticket = req.ticket;
        console.log(req.body) ; 
        const { newAssigneeId } = req.body;
        if (!newAssigneeId) {
            return res.status(400).json({ success: false, message: 'newAssignee is required' });
        }

        const currentAssigneeId = ticket.primaryAssignee?.toString() || null;
        const requesterId = req.user._id.toString();
        if (req.user.role === 'agent') {
            const isOnTicket = currentAssigneeId === requesterId || ticket.collaborators.some((c) => c.toString() === requesterId);
            if (!isOnTicket) {
                return res.status(403).json({ success: false, message: 'you are not on this ticket' });
            }
            if (currentAssigneeId === requesterId && newAssigneeId !== requesterId) {
                return res.status(403).json({ success: false, message: "Agents Cannot reassign a ticket from themselves" });
            }
        }
        if (newAssigneeId === currentAssigneeId) {
            return res.status(400).json({ success: false, message: 'Ticket is already assigned to that agent' });
        }

        await AssignmentEvent.create({
            ticket: ticket._id,
            actor: req.user._id,
            oldAssignee: ticket.primaryAssignee || null,
            newAssignee: newAssigneeId,
        });
        ticket.primaryAssignee = newAssigneeId;
        await ticket.save();
        return res.status(200).json({ success: true, ticket });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to Reassign ticket', error: error.message });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' });
        }
        await changeStatus(req.ticket, status, req.user);
        await req.ticket.save();
        return res.status(200).json({ success: true, ticket: req.ticket });
    } catch (error) {
        console.log(error);
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

export const addCollaborator = async (req, res) => {
    try {
        const { agentId } = req.body;
        const ticket = req.ticket;
        if (req.user.role !== 'supervisor' && ticket.primaryAssignee?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Only the primary Assignee or supervisor can add collaborators" });
        }
        const agent = await User.findById(agentId);
        console.log(agent) ; 
        if (!agent || agent.role !== 'agent') {
            return res.status(400).json({ success: false, message: 'collaborators must be existing agents' });
        }
        if (ticket.primaryAssignee?.toString() === agentId) {
            return res.status(400).json({ success: false, message: "The Primary assignee cannot also be collaborator" });
        }
        if (ticket.collaborators.some((c) => c.toString() === agentId)) {
            return res.status(400).json({ success: false, message: "Already a collaborator" });
        }

        ticket.collaborators.push(agentId);
        await ticket.save();
        await CollaboratorAddedEvent.create({ ticket: ticket._id, actor: req.user._id, collaborator: agentId });
        return res.status(200).json({ success: true, ticket });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const removeCollaborator = async (req, res) => {
    try {
        const { agentId } = req.body;
        const ticket = req.ticket;
        if (req.user.role !== 'supervisor' && ticket.primaryAssignee?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "only primary assignee or supervisor can remove collaborator" });
        }
        ticket.collaborators = ticket.collaborators.filter((c) => c.toString() !== agentId);
        await ticket.save();
        await CollaboratorRemovedEvent.create({ ticket: ticket._id, actor: req.user._id, collaborator: agentId });
        return res.status(200).json({ success: true, ticket });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to remove collaborator", error: error.message });
    }
};

export const bulkReassign = async (req, res) => {
  const { ticketIds, newAssigneeId } = req.body;
  const results = [];

  for (const id of ticketIds) {
    const ticket = await Ticket.findById(id);
    if (!ticket) { results.push({ ticketId: id, success: false, reason: "Ticket not found" }); continue; }

    const currentId = ticket.primaryAssignee?.toString() || null;
    const requesterId = req.user._id.toString();
    const isOnTicket = currentId === requesterId || ticket.collaborators.some((c) => c.toString() === requesterId);

    if (req.user.role === "agent" && !isOnTicket) {
      results.push({ ticketId: id, success: false, reason: "You are not on this ticket" }); continue;
    }
    if (req.user.role === "agent" && currentId === requesterId && newAssigneeId !== requesterId) {
      results.push({ ticketId: id, success: false, reason: "Agents cannot reassign away from themselves" }); continue;
    }

    await AssignmentEvent.create({ ticket: id, actor: req.user._id, oldAssignee: ticket.primaryAssignee, newAssignee: newAssigneeId });
    ticket.primaryAssignee = newAssigneeId;
    await ticket.save();
    results.push({ ticketId: id, success: true });
  }

  return res.status(200).json({ success: true, results });
};

export const bulkClose = async (req, res) => {
  const { ticketIds } = req.body;
  const results = [];

  for (const id of ticketIds) {
    const ticket = await Ticket.findById(id);
    if (!ticket) { results.push({ ticketId: id, success: false, reason: "Ticket not found" }); continue; }
    try {
      await changeStatus(ticket, "closed", req.user);
      await ticket.save();
      results.push({ ticketId: id, success: true });
    } catch (error) {
      results.push({ ticketId: id, success: false, reason: error.message });
    }
  }

  return res.status(200).json({ success: true, results });
};

export const exportCsv = async (req, res) => {
  const filter = buildTicketFilter(req);
  const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const header = "id,subject,status,priority,category,primaryAssignee,createdAt\n";
  const rows = tickets.map((t) =>
    [t._id, t.subject, t.status, t.priority, t.category, t.primaryAssignee || "", t.createdAt.toISOString()].map(escape).join(","),
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=tickets.csv");
  return res.status(200).send(header + rows.join("\n"));
};

export const getTimeline = async (req, res) => {
  const events = await TimelineEvent.find({ ticket: req.ticket._id })
    .sort({ createdAt: 1 })
    .populate("actor", "name role")
    .populate("newAssignee oldAssignee collaborator", "name")
    .populate("message");

  return res.status(200).json({ success: true, events });
};

export const listAgents = async (req ,res) => {
    try {
        const agents = await User.find({role : 'agent'} , 'name email') ; 
        return res.status(200).json({success : true , agents}) ; 

    } catch (error) {
        return res.status(500).json({success : false , message :error.message}) ; 
    }
}