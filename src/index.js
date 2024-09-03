// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/db.js";

dotenv.config({
    path:'./env'
})

connectDB();


































/*
import express from "express";
const app = express();

(async ()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`);
       app.on("error",(error)=>{
        console.log("error:",error);
        throw error;
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is running at http://localhost:${process.env.PORT}`);
       })

    }catch(error){
        console.error("ERROR: ",error);
    }
    
})();
*/