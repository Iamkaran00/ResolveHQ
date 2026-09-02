import User from "../models/user.models.js";
import bcrypt from 'bcryptjs' ;
import jwt from 'jsonwebtoken' ; 
const generateToken = user => {
  return jwt.sign(
    {
      id : user._id , 
      role : user.role,
    },
    process.env.JWT_SECRET , 
    {
      expiresIn : '7d' , 
    }
  )

}

const cookieOptions = {
  httpOnly : true , 
  secure : process.env.NODE_ENV === 'production' , 
  sameSite : "lax" , 
  maxAge : 7*24*60*60*1000,
};
 export const registerUser = async (req ,res) => {
    try {
    const {name , email , password} = req.body ;   
    if(!name || !email || !password) {
        return res.status(400).json( { success : false , message : "Fill Entries First!!!" })
    }
    const existingUser = await User.findOne({email : email.toLowerCase().trim()}) ;
    if(existingUser)  {
        return res.status(409).json({              
            success : false , 
            message : "Email Already Exists."
        })
    }
    const hashpassword = await bcrypt.hash(password , 10); 
    const user = await User.create({
        name , 
        email : email.toLowerCase().trim() , 
        hashpassword,
        role : "agent",                               
    })
    const token = generateToken(user) ; 
    res.cookie('token' , token , cookieOptions) ; 
    return res.status(201).json({
        message : "Signup Succeed" , 
        user :  { id : user._id , name : user.name , email : user.email , role : user.role }
    })
    } catch (error) {
        return res.status(500).json({ message : 'Internal Server Error' })
    }
}
export const login  = async (req ,res) => {
    try {
        const {email , password} = req.body ; 
        if(!email || !password) {
            return res.status(400).json({
                message :'Fill the Entries First' , 
            })
        }
        const user = await User.findOne( {
            email : email.toLowerCase().trim()
        }) ; 
        if(!user) {
            return res.status(401).json({
           message : "Invalid email or password"
            })
        }
        const isPasswordCorrect = await bcrypt.compare(
            password , 
            user.hashpassword
        )
        if(!isPasswordCorrect) {
            return res.status(401).json({
                success : false , 
                message : 'Invalid email or Password' 
            })
        }

        const token = generateToken(user) ; 
        res.cookie('token', token , cookieOptions) ; 
        return res.status(200).json({
            success : true , 
            message : 'Login Attemp Successfull' , 
            user : {
                id : user._id , 
                name : user.name , 
                email : user.email , 
                role : user.role,
            }
        })
    } catch (error) {
        console.log('An Error Occured while Login ' , error) ; 
        return res.status(500).json({
            success : false,
            message : "Internal Server Error" ,
        })
    }
}
export const logout = (req,res) => {
    res.clearCookie('token',cookieOptions) ; 
    return res.status(200).json({
        success : true , 
        message : 'Logout Successfull !'
    })
}


export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-hashpassword");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log("Get User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};