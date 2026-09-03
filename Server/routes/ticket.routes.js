 import express from 'express' ; 
 import Ticket from '../models/ticket.model.js';
import { authenticate,requireRole } from '../middlewares/auth.middleware.js'; 
import { loadTicket,requireTicketAccess } from '../middlewares/ticket.middleware.js';
import * as ticketController from '../controllers/ticket.controller.js' ; 
import * as messageController from '../controllers/message.controller.js'
const router = express.Router() ;

//every ticket route require a logged in user 

router.use(authenticate) ; 

// no ticket Id yet , so no loadTickt/requiretickaccess needed  ; 

router.post('/',ticketController.createTicket) ; 
router.get('/',ticketController.listTickets) ; 
//bulk actions routes
router.patch("/bulk/reassign", ticketController.bulkReassign);
router.patch("/bulk/close", ticketController.bulkClose);
router.get("/export", ticketController.exportCsv);
//everything below needs a specific ticket , loaded once and access-checked once will be good practice 
const withTicket = [loadTicket(Ticket),requireTicketAccess] ; 

// ticket actions routes 
router.get("/:id", ...withTicket, ticketController.getTicketById);
router.patch("/:id", ...withTicket, ticketController.updateTicket);
router.patch("/:id/archive", ...withTicket, ticketController.archiveTicket);
router.patch("/:id/restore", ...withTicket, ticketController.restoreTicket);
router.patch("/:id/reassign", ...withTicket, ticketController.reassignTicket);
router.patch("/:id/status", ...withTicket, ticketController.updateTicketStatus);

//internal notes or reply routes 
router.post("/:id/messages", ...withTicket, messageController.addMessage);
router.get("/:id/messages", ...withTicket, messageController.getMessages);

//collaborators routes 
router.post("/:id/collaborators", ...withTicket, ticketController.addCollaborator);
router.delete("/:id/collaborators", ...withTicket, ticketController.removeCollaborator);

// timeline routes

router.get("/:id/timeline", ...withTicket, ticketController.getTimeline);
export default router ; 