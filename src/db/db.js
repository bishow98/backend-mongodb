import mongoose from "mongoose";
import { DATABASE_NAME} from "../constants.js";
const connectDB = async ()=>{
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`); 
       console.log(`\n MongoDB connected at ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection error:",error);
        process.exit(1)
    }
}

export default connectDB;