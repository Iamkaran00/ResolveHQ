import mongoose from 'mongoose' ; 
const messageSchema = new mongoose.Schema( 
{
    ticket : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Ticket" , 
        required : true,
    },
    author : {
        type : mongoose.Schema.Types.ObjectId , 
        ref : "User" , 
        required : true,
    },
    body : {
        type : String , 
        required : true , 
        trim : true , 
    },
    type : {
        type : String , 
        enum : ['reply' , 'internal_note'] , 
        required : true
    }
},{
    timestamps : true , 
}
)

export default Message = mongoose.model('Message' , messageSchema) ; 