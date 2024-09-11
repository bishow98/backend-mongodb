// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import {app} from "./app.js"

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||4500, ()=>{
        console.log(`Server running at port: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`Mongo Db connection error : ${error}`);
})



































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