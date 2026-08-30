import jwt from 'jsonwebtoken' ; 

const authenticate = async (req,res,next) => {
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
    req.user = decoded ; 
    next() ; 


} catch (error) {
    console.log('An Error Occured') ; 
    return res.status(401).json( {
        success : false , 
        message : "Invalid or Expired Token"
    })
}
}


const isAgent = async (req, res, next) => {
    try {
        if(req.user.role !== 'agent') {
            return res.status(402).json({
                success : false , 
                message : "This Route is for agents only" , 
            })
        }
        next() ; 
    } catch (error) {
        return res.status(500).json({
            success : false, 
            message : 'Something Went Wrong' , 
        })
    }
}



const isSupervisor = async (req, res, next) => {
    try {
        if (req.user.role !== "supervisor") {
            return res.status(403).json({
                success: false,
                message: "This route is for supervisors only",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};


export {
    auth,
    isAgent,
    isSupervisor,
};