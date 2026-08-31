 
 //fetches the ticket once , attatches it , 404s early - every ticket route needs this before it 

 export const loadTicket = (Ticket) => async (req , res , next) => {
    const ticket = await Ticket.findById(req.params.id) ; 
    if(!ticket) return res.status(404).json({success : false , message : "Ticket not found"}) ; 
    req.ticket = ticket ; 
    next() ;
 } ;

 // the actual 'primary assignee or collaborator' rule from purpose , supervisor bypass this ->

 export const requireTicketAccess = (req,res,next) => {
    if(req.user.role ==='supervisor') return next() ; 
    const userId = req.user._id.toString() ; 
    const isAssignee = req.ticket.primaryAssignee?.toString() === userId ; 
    const isCollaborator = req.ticket.collaborators.some(( c)=>c.toString()===userId) ; 
    if(!isAssignee && !isCollaborator) {
        return res.status(403).json({success : false , message : "You are not on this ticket"})
    } 
    next();
 }