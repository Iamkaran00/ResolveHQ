import { StatusChangeEvent } from "../models/timelineEvent.model.js";
import { REOPEN_WINDOW_MS } from "../constants/ticketEnums.js";
import SLAAlert from "../models/slaAlert.model.js";
//the only edges server will ever accept - anything else get rejected 
const TRANSITIONS = {
    new : ['open'] , 
    open : ['pending','resolved'] ,
    pending : ['open' , 'resolved'] , 
    resolved : ['closed','open'] , 
    closed : ['open'] , // only within the reopen window 
}

// clock runs in new/open , pauses everywhere else.

const RUNNING_STATES = ['new' , 'open'] ; 

export const computeElapsedMs = ticket => {
    const {accumulatedMs , runningSince} = ticket.clock ; 
    if(!runningSince) return accumulatedMs ; 
    return accumulatedMs + (Date.now() - runningSince.getTime()) ; 
} ; 

export const isBreached = ticket => computeElapsedMs(ticket) >= ticket.slaTargetMinutes*60*1000 ; 

// mutates ticket in place , does not save -- caller save once , after any other field changes 

export const changeStatus = async (ticket , newStatus , actor) => {
  const allowed = TRANSITIONS[ticket.status] || [] ; 
  if(!allowed.includes(newStatus)) {
    const err = new Error(`Cannot move a ticket from "${ticket.status}" to "${newStatus}"`) ; 
    err.status = 400 ; 
    throw err ; 
  } 
  if(newStatus === 'closed' && actor.role !== 'supervisor') {
    const err = new Error("Only supervisors can close tickets") ; 
    err.status = 403 ; 
    throw err ;
  } 
  
  if (ticket.status === 'closed' && newStatus === 'open') {
      if (!ticket.closedAt) {
    const err = new Error("Ticket has no close timestamp; cannot verify reopen window");
    err.status = 400;
    throw err;
  }
    const withinWindow = Date.now() - ticket.closedAt.getTime() <= REOPEN_WINDOW_MS ;
     if(!withinWindow) {
        const err = new Error("Reopen window has passed; this ticket stays closed") ; 
        err.status = 400 ; 
        throw err ; 
     }
  }


  const wasRunning = RUNNING_STATES.includes(ticket.status) ; 
  const willRun = RUNNING_STATES.includes(newStatus) ;
  if(wasRunning && !willRun) {
    //freezing : bank the elapsed time , stop the clock 
     ticket.clock.accumulatedMs += Date.now() - ticket.clock.runningSince.getTime() ; 
     ticket.clock.runningSince = null ; 
  } else if(!wasRunning && willRun){
// resuming : start counting again from now ; 
ticket.clock.runningSince = new Date() ; 

  }

  if(newStatus === 'resolved') ticket.resolvedAt = new Date() ;
  if(ticket.status === 'resolved' && newStatus !== 'resolved') ticket.resolvedAt = null ; 
  if(newStatus === 'closed') ticket.closedAt = new Date() ; 
  await StatusChangeEvent.create({
    ticket : ticket._id ,
    actor : actor._id , 
    oldStatus : ticket.status , 
    newStatus ,
  })  ; 

  ticket.status = newStatus ; 
  if (newStatus === "resolved" || newStatus === "closed") {
    await SLAAlert.deleteMany({ ticket: ticket._id, acknowledged: false });
  }
};