import jwt from 'jsonwebtoken' ; 
import User from '../models/user.models.js';
export const authenticate = async (req,res,next) => {
try {
    const token = req.cookies?.token ; 
    if(!token) {
        return res.status(401).json({
            success : false , 
            message : "Authentication Required" , 
        });
    }
    const decoded = jwt.verify(
        token , process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id) ; 
    if(!user) return res.status(401).json({success : false , message : "Invalid Or Expired Token"}) ; 

    req.user = user ; 
    next() ; 


} catch (error) {
    console.log('An Error Occured') ; 
    return res.status(401).json( {
        success : false , 
        message : "Invalid or Expired Token"
    })
}
}
export const requireRole = (...roles) => function(req,res,next) {
    if(!roles.includes(req.user.role)) {
        return res.status(403).json({success : false, message : 'Access Denied'})
    }
next() ; 
}
  