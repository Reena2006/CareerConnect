import {Router} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {requireAuth} from "../middleware/auth.js";
const r=Router();
const token=u=>jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:"8h"});
const safe=u=>({id:u._id,name:u.name,email:u.email,role:u.role,department:u.department,skills:u.skills});
r.post("/register",async(req,res,next)=>{try{
 const {name,email,password,department=""}=req.body;
 if(!name?.trim()||!email?.trim()||!password)return res.status(400).json({message:"Name, email and password are required."});
 if(password.length<8)return res.status(400).json({message:"Password must contain at least 8 characters."});
 const e=email.trim().toLowerCase();if(await User.exists({email:e}))return res.status(409).json({message:"Email already registered."});
 const u=await User.create({name:name.trim(),email:e,passwordHash:await bcrypt.hash(password,12),department,role:"student"});
 res.status(201).json({token:token(u),user:safe(u)});
 }catch(e){next(e)}});
r.post("/login",async(req,res,next)=>{try{
 const {email,password}=req.body;const u=await User.findOne({email:String(email||"").trim().toLowerCase()});
 if(!u||!await bcrypt.compare(password||"",u.passwordHash))return res.status(401).json({message:"Incorrect email or password."});
 res.json({token:token(u),user:safe(u)});
 }catch(e){next(e)}});
r.get("/me",requireAuth,(req,res)=>res.json({user:safe(req.user)}));
export default r;
