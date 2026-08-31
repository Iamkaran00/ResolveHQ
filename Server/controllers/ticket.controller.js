import Ticket from "../models/ticket.model";

import { AssignmentEvent } from "../models/timelineEvent.model";

import { PRIORITIES,SLA_TARGET_MINUTES } from "../constants/ticketEnums";


export const createTicket = async (req, res) => {
    try {
        const {subject , description , requester , priority , category,primaryAssignee ,collaborators } = req.body ; 

        if(!subject || !description || !requester?.name || !requester?.email ||!priority || !category) return res.status(400).json({success : false , message : 'Missing required Fields'}) ; 
        if(!PRIORITIES.includes(priority)) {
            return res.status(400).json({success : false , message :`priority must be one of ${PRIORITIES.join(", ")}`});
        }

        const ticket = await Ticket.create({
            subject , 
            description , 
            requestor , 
            priority , 
            category , 
            primaryAssignee : primaryAssignee || null , 
            collaborators : collaborators || [] , 
            slaTargetMinutes : SLA_TARGET_MINUTES[priority] , 
            clock : {accumulatedMs : 0 , runningSince : new Date()} // status default to 'new',clock started running immediate
        }) ; 

        return res.status(201).json({success : true , ticket}) ; 


    } catch (error) {
        return res.status(500).json({success : false ,message : 'Failed To Create Ticket' , error : error.message}) ; 
    }
}
// role- scoped list as of now 

export const listTickets = async (req, res) =>{
    try {
        const filter = {archived : false} ; 
        if(req.user.role === 'agent') {
            filter.$or = [{primaryAssignee : req.user._id} , {collaborators : req.user._id}] ; 
        }


        const ticket = await Ticket.find(filter).sort({createdAt : -1}) ; 
        return res.status(200).json({success : true , ticket}) ; 
    } catch (error) {
       return res.status(500).json({success : false , message : 'Failed to List tickets',error : error.message })
    }
};


//loadTicket + requireTicketAccess middleware already ran before this - req.ticket safe to use

export const getTicketById = async(req,res) => {
    return res.status(200).json({success : true , ticket : req.ticket}) ; 
} ; 

export const updateTicket = async (req,res) => {
    try {
        const ticket = req.ticket ; 
        const {subject,description , priority , category} = req.body ; 
         if(priority) {
            if(!PRIORITIES.includes(priority)) {
                return res.status(400).json({success :false, message : `priority must be one of ${PRIORITIES.join(', ')}`}) ; 
            }
            ticket.priority = priority ; 
         }
         if(subject) ticket.subject = subject ; 
         if(description) ticket.description = description ; 
         if(category) ticket.category = category ; 
         await ticket.save() ; 
         return res.status(200).json({success : true , ticket}) ; 
        
    } catch (error) {
        return res.status(500).json({success : false , message : 'failed to update tickt' ,error : error.message}) ; 
    }
};



export const archiveTicket = async (req,res) => {
    try {
        const ticket = req.ticket ; 
        if(ticket.archived) {
            return res.status(400).json({success : false , message : "Ticket is Already archived"}) ; 
        }
        ticket.archived = true ; 
        ticket.archivedAt = new Date() ; 
        await ticket.save() ;
        return res.status(200).json({success : true , ticket}) ; 
        
    } catch (error) {
       return res.status(500).json({success : false , message : 'Failed to archive ticket',error : error.message}) ;  
    }
}


export const restoreTicket = async(req,res) => {
    try {
        const ticket = req.ticket ; 
        if(!ticket.archived) {
            return res.status(400).json({success : false , message : 'Ticket is Not Archived'}) ; 
        }
        ticket.archived = false ; 
        ticket.archivedAt = null ; 
        await ticket.save() ; 
        return res.status(200).json({success : true , message : "Successfully Restored Ticket"}) ; 
    } catch (error) {
       return res.status(500).json({success : false , message : 
        'Failed to restore ticket' , error : error.message
       }) 
    }
}

export const reassignTicket = async(req,res) => {
    try {
        const ticket = req.ticket ; 
        const {newAssigneeId} = req.body ; 
        if(!newAssigneeId) {
            return res.status(400).json({success : false , message : 'newAssignee is required'}) ;
         }

         const currentAssigneeId = ticket.primaryAssignee?.toString() || null; 
         const requesterId = req.user._id.toString() ; 
         if(req.user.role==='agent') {
            const isOnTicket = currentAssigneeId === requesterId|| ticket.collaborators.some((c)=>c.toString()===requesterId) ; 
          if(!isOnTicket) {
            return res.status(403).json({success : false , message :'you are not on this ticket'}) ; 
          }
          if(currentAssigneeId === requesterId && newAssigneeId!==requesterId) {
            return res.status(403).json({success : false , message : "Agents Cannot reassign a ticket from themselves"}) ; 
          }
        } 
        if(newAssigneeId === currentAssigneeId) {
            return res.status(400).json({success : false , message : 'Ticket is already assigned to that agent'}) ; 
        }
   
         await AssignmentEvent.create({
            ticket : ticket._id , 
            actor : req.user._id , 
            oldAssignee : ticket.primaryAssignee||null , 
            newAssignee : newAssigneeId ,
         })
         ticket.primaryAssignee = newAssigneeId ; 
         await ticket.save() ;
         return res.status(200).son({success : true , ticket}) ; 
    } catch (error) {
        return res.status(500).json({success : false , message : 'Failed to Reassign ticket' , error : error.message}); 
    }
}
