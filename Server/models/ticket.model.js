import mongoose from 'mongoose'; 

const ticketSchema = new mongoose.Schema( {
    subject : {
        type : String , 
        required : true , 
        trim : true , 
    } , 
    description : {
        type : String , 
        required : true , 
        trim : true,
    },
    requester : {
        name : {
            type : String , required : true ,
            trim : true,
        },
        email : {
            type : String , 
            required : true , 
            trim : true ,
            lowercase : true , 
        }
    },
    priority : {
        type : String , 
        enum : ['low' , 'medium' , 'high' , 'urgent'] ,
        required : true , 
    },
    category : {
        type : String , 
        enum : ['billing' , 'technical' , 'account','general'] , 
        required : true , 
    },
    status : {
        type : String , 
        enum : ['new' , 'open' ,'pending' , 'closed','resolved'],
        default : 'new',
    },
    primaryAssignee : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User" , 
        default : null,
        
    },
    collaborators : [
        {
            type : mongoose.Schema.Types.ObjectId,ref : 'User'
        }
    ],
    archived : {type : Boolean , default : false} , 
    archivedAt : {type : Date , default : null} ,
    slaTargetMinutes : {type : Number , required : true} , 
    clock : {
     accumulatedMs : {type : Number , default : 0} , 
     pendingSince : {type : Date , default : null} ,
    },
    closedAt : {type : Date , default : null}

} , {timestamps : true}) ; 

export default Ticket = mongoose.model("Ticket",ticketSchema) ; 