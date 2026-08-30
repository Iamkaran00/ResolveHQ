import express from 'express'; 
import cors from 'cors' ; 
import dotenv from 'dotenv' ; 
import dbconnection from './configs/database.config.js';
dotenv.config({
    path :'./.env' ,
});

const app = express() ; 
const PORT = process.env.PORT || 5501

// connecting with db 
dbconnection() ; 



app.use(express.urlencoded({limit : '10kb',extended : true})) ;
app.use(express.json({limit : '100kb'})) ; 
app.use(cors()) ; 

app.get('/',(req,res)=> {
    return res.json({
        success : true , 
        message : "Server is up and Running..." , 
    })
})
 const startServer = ()=>{
    dbconnection();
    app.listen(PORT , ()=> {
    console.log('ResolvHQ backend running at PORT ' , PORT);
 })

 }
 startServer();












 