import mongoose, { mongo } from 'mongoose' ; 
const timelineEventSchema = new mongoose.Schema(
 
    {
        ticket : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "Ticket" , 
            required : true , 
        },
        actor : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "User" , 
            required : true , 
        }
    } , 
    {
        discriminatorKey : "type" ,
        timestamps : {
            createdAt : true , 
            updatedAt : false , 
        }
    }
);

const TimelineEvent = mongoose.model(
    "TimelineEvent" , 
    timelineEventSchema
) ; 


// for status change 
const StatusChangeEvent = TimelineEvent.discriminator('status_change' , new mongoose.Schema({
    oldStatus : {
        type : String , 
        required : true, 
    } , 
    newStatus : {
        type : String , 
        required : true , 
    }
}));


//for ticket assignment/reassignment 

const AssignmentEvent = TimelineEvent.discriminator(
    'assignment' , 
    new mongoose.Schema ({
        oldAssignee : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "User" , 
            default : null , 
        } , 
        newAssignee : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "User" , 
            required : true , 
        }
    })
) ; 


// Collaborator added 
const CollaboratorAddedEvent = TimelineEvent.discriminator(
    'collaborator_added' , 
    new mongoose.Schema({
        collaborator : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "User" , 
            required : true , 
        }
    })
)

//Collaborator removed 

const CollaboratorRemovedEvent = TimelineEvent.discriminator(
    'collaborator_removed' , 
    new mongoose.Schema({
        collaborator : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "User" , 
            required : true , 
        }
    })
)

//Reply Added 

const ReplyEvent = TimelineEvent.discriminator(
    'reply' , 
    new mongoose.Schema({
        message : {
            type : mongoose.Schema.Types.ObjectId , 
            ref : "Message" , 
            required : true , 
        },
    })
) ; 


// Internal note added

const InternalNoteEvent = TimelineEvent.discriminator(
    'internal_note' , 
    new mongoose.Schema({
        message : {
            type : mongoose.Schema.Types.ObjectId ,
            ref : "Message" , 
            required : true, 
        }
    })
)

// Priority changed 


const PriorityChangeEvent = TimelineEvent.discriminator(
    'priority_change' , 
    new mongoose.Schema({
        oldPriority : {
            type : String , 
            required : true, 
        },
        newPriority : {
            type : String , 
            required : true , 
        }
    })
)

// Ticket Got In Archive 

const ArchiveEvent = TimelineEvent.discriminator(
    'archived' , 
    new mongoose.Schema({}) 
) ; 

// Ticket Restored 

const RestoreEvent = TimelineEvent.discriminator(
    'restored' , 
    new mongoose.Schema({}) 
)

export {
    StatusChangeEvent,ArchiveEvent , RestoreEvent , PriorityChangeEvent , InternalNoteEvent , CollaboratorAddedEvent , CollaboratorRemovedEvent , ReplyEvent,TimelineEvent,AssignmentEvent
}