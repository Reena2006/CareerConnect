import {Router} from "express";
import Job from "../models/Job.js";
import {requireAuth,requireAdmin} from "../middleware/auth.js";
const r=Router();
function data(b){return {title:String(b.title||"").trim(),company:String(b.company||"").trim(),location:String(b.location||"").trim(),type:["Internship","Full-time","Part-time"].includes(b.type)?b.type:"Internship",description:String(b.description||"").trim(),skills:Array.isArray(b.skills)?b.skills.map(String).map(s=>s.trim()).filter(Boolean):String(b.skills||"").split(",").map(s=>s.trim()).filter(Boolean),deadline:b.deadline?new Date(b.deadline):null};}
function valid(d){return d.title&&d.company&&d.location&&d.description;}
const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); // user input must never break the $regex
r.get("/",async(req,res,next)=>{try{
 const f={};if(req.query.q){const q=esc(String(req.query.q).slice(0,100));f.$or=[{title:{$regex:q,$options:"i"}},{company:{$regex:q,$options:"i"}},{location:{$regex:q,$options:"i"}},{skills:{$regex:q,$options:"i"}}];}
 if(["Internship","Full-time","Part-time"].includes(req.query.type))f.type=req.query.type;
 res.json({jobs:await Job.find(f).populate("createdBy","name").sort({createdAt:-1}).limit(100)});
 }catch(e){next(e)}});
r.post("/",requireAuth,requireAdmin,async(req,res,next)=>{try{const d=data(req.body);if(!valid(d))return res.status(400).json({message:"Title, company, location and description are required."});res.status(201).json({job:await Job.create({...d,createdBy:req.user._id})});}catch(e){next(e)}});
r.put("/:id",requireAuth,requireAdmin,async(req,res,next)=>{try{const d=data(req.body);if(!valid(d))return res.status(400).json({message:"Title, company, location and description are required."});const j=await Job.findByIdAndUpdate(req.params.id,d,{new:true,runValidators:true});if(!j)return res.status(404).json({message:"Job not found."});res.json({job:j});}catch(e){next(e)}});
r.delete("/:id",requireAuth,requireAdmin,async(req,res,next)=>{try{const j=await Job.findByIdAndDelete(req.params.id);if(!j)return res.status(404).json({message:"Job not found."});res.json({message:"Job deleted."});}catch(e){next(e)}});
export default r;
