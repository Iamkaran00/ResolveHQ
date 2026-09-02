import express from 'express' ;
import { registerUser ,login,logout} from '../controllers/auth.controller.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { requireRole } from '../middlewares/auth.middleware.js';
const {Router} = express;

const router = Router() ; 

router.post('/signup',registerUser) ; 
router.post('/login' , login) ; 
router.post('/logout' , logout) ;
router.get('/dashboard' , requireRole('supervisor') , getDashboard); 

export default router ; 