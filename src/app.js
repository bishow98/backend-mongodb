import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
//yo app.use method le chai middleware mount garna help garxa
//express.json: build in middleware in express js
app.use(express.json({ limit: "16kb" }));

/*express.urlencoded is build in middleware it parses the incoming request with urlencoded payloads and is based on body-parser: ex: jastai brower ma search garda + %20 yesto aaunxa teslai handle garxa */
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

//express.static le chai static file lai serve garxa. public assest haru lai user garxa
app.use(express.static("public"));

//it allows the server to automatically parse cookies sent by the client in the Cookie header of the request. server le user ko browser lai access garera crud operation haru garna sakinxa .
app.use(cookieParser());




//routes import 
import userRouter from "./routes/user.routes.js"; //user route lai import garyo yaha 
import videoRouter from "./routes/video.routes.js";//video route lai import garyo yaha





//import router in this file yo import chai middleware hisab le huxna so app.use() yo method nai call garney 
//routes declaration 
app.use("/api/v1/users",userRouter);
//http://localhost:8000/api/v1/users/register

app.use("/api/v1/videos", videoRouter);
//http://localhost:8000/api/v1/videos



export { app };
