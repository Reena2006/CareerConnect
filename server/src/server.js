import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
const app=express(),port=Number(process.env.PORT||5000);
if(!process.env.JWT_SECRET){console.error("Set JWT_SECRET in server/.env");process.exit(1);}
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"}));
app.use(express.json({limit:"1mb"}));app.use(express.urlencoded({extended:true}));
app.get("/api/health",(_q,s)=>s.json({status:"ok",app:"CareerConnect API"}));
app.use("/api/auth",authRoutes);app.use("/api/jobs",jobRoutes);app.use("/api/applications",applicationRoutes);
app.use((e,_q,s,_n)=>{console.error(e);if(e.code===11000)return s.status(409).json({message:"Record already exists."});if(e.name==="ValidationError"||e.name==="CastError")return s.status(400).json({message:"Invalid input or record ID."});if(e.message?.includes("Resume must be")||e.code==="LIMIT_FILE_SIZE")return s.status(400).json({message:e.code==="LIMIT_FILE_SIZE"?"Resume must be 5 MB or smaller.":e.message});s.status(500).json({message:"Server error. Check backend terminal."});});
async function start(){await mongoose.connect(process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/careerconnect");console.log("MongoDB connected");
 const email=(process.env.ADMIN_EMAIL||"admin@careerconnect.local").toLowerCase();
 if(!await User.exists({email}))await User.create({name:process.env.ADMIN_NAME||"CareerConnect Admin",email,passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD||"Admin123!ChangeMe",12),role:"admin"});
 app.listen(port,()=>console.log(`API at http://localhost:${port}`));
}
start().catch(e=>{console.error("Startup failed:",e.message);process.exit(1)});
