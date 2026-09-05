import express from 'express'; 
import cors from 'cors' ; 
import dotenv from 'dotenv' ; 
import cookieParser from 'cookie-parser' ;
import dbconnection from './configs/database.config.js';
import userRoutes from './routes/user.routes.js';
import ticketRoutes from './routes/ticket.routes.js' ; 
import alertRoutes from './routes/slaAlert.routes.js'
import { startSlaSweep } from './jobs/slaSweep.job.js';
dotenv.config({
    path :'./.env' ,
});

const app = express() ; 
const PORT = process.env.PORT || 5501

 


app.use(cookieParser()) ; 
app.use(express.urlencoded({limit : '10kb',extended : true})) ;
app.use(express.json({limit : '100kb'})) ; 
app.use(
  cors({
    origin: "https://resolve-hq.vercel.app",
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log("REQUEST RECEIVED");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  next();
});
app.use('/api/v1/auth',userRoutes) ; 
app.use('/api/v1/tickets',ticketRoutes) ; 
app.use("/api/v1/alerts", alertRoutes);
app.get('/',(req,res)=> {
    return res.json({
        success : true , 
        message : "Server is up and Running..." , 
    })
})
 const startServer = async ()=>{
    await dbconnection();
    startSlaSweep();
    app.listen(PORT , ()=> {
    console.log('ResolvHQ backend running at PORT ' , PORT);
 })

 }
 startServer();
