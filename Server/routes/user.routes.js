import express from 'express' ;
import { registerUser ,login,logout} from '../controllers/auth.controller.js';
const {Router} = express;

const router = Router() ; 

router.post('/signup',registerUser) ; 
router.post('/login' , login) ; 
router.post('/logout' , logout) ; 

export default router ; 