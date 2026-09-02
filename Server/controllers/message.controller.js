import Message from "../models/message.model.js"; 
import { ReplyEvent,InternalNoteEvent } from "../models/timelineEvent.model.js";
import { changeStatus } from "../services/ticketLifecycle.service.js";

export const addMessage = async(req,res) => {
    try{
        const {body , isInternal} = req.body ; 
        if(!body) {
            return res.status(400).json({
                success : false , 
                message : "body is required" 
            })
        }
        const type  = isInternal ? "internal_note" : "reply" ; 
        const message = await Message.create({
            ticket:req.ticket._id , 
            author: req.user._id , 
            body , type,
        });
        const EventModel = isInternal ? InternalNoteEvent : ReplyEvent ; 
        await EventModel.create({ticket : req.ticket._id , actor : req.user._id , message : message._id}) ; 

//a customer visible reply logged while pending is the 'customer repled ' event - customer have no login, so an agent logging a reply on their behalf IS that trigger 
if(!isInternal && req.ticket.status === 'pending') {
    await changeStatus(req.ticket, "open",req.user) ; 
    await req.ticket.save() ; 
}
return res.status(201).json({success : true , message}) ; 
    }catch(error) {
console.log(error) ; 
return res.status(500).json({success : false , message : 'failed to add message' , error : error.message}) ; 
    }
}

export const getMessages = async(req,res) => {
    try {
        const messages = await Message.find({ticket : req.ticket._id}).sort({createdAt : 1}).populate("author" , "name role") ; 
        return res.status(200).json({success : true,messages}) ; 
        
    } catch (error) {
        console.log(error) ; 
        return res.status(500).json({success : false , message : error.message}) ; 
    }
}