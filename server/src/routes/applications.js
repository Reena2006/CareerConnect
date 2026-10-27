import {Router} from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {fileURLToPath} from "url";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import {requireAuth,requireAdmin} from "../middleware/auth.js";
const r=Router();
// Resolve the upload folder from this file, so it works whatever directory the server is started from.
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../uploads");
fs.mkdirSync(dir,{recursive:true});
const upload=multer({storage:multer.diskStorage({destination:(_q,_f,cb)=>cb(null,dir),filename:(_q,f,cb)=>cb(null,Date.now()+"-"+Math.round(Math.random()*1e9)+path.extname(f.originalname).toLowerCase())}),limits:{fileSize:5*1024*1024},fileFilter:(_q,f,cb)=>[".pdf",".doc",".docx"].includes(path.extname(f.originalname).toLowerCase())?cb(null,true):cb(new Error("Resume must be PDF, DOC, or DOCX."))});
r.post("/:jobId",requireAuth,upload.single("resume"),async(req,res,next)=>{try{
 if(req.user.role!=="student")return res.status(403).json({message:"Only students can apply."});
 const job=await Job.findById(req.params.jobId);if(!job)return res.status(404).json({message:"Job not found."});
 if(job.deadline&&job.deadline<new Date())return res.status(400).json({message:"Application deadline passed."});
 if(await Application.exists({student:req.user._id,job:job._id}))return res.status(409).json({message:"Already applied to this opportunity."});
 const a=await Application.create({student:req.user._id,job:job._id,resumePath:req.file?.filename||"",coverLetter:String(req.body.coverLetter||"").trim()});
 res.status(201).json({application:a,message:"Application submitted successfully."});
 }catch(e){next(e)}});
r.get("/mine/list",requireAuth,async(req,res,next)=>{try{if(req.user.role!=="student")return res.status(403).json({message:"Student access required."});res.json({applications:await Application.find({student:req.user._id}).populate("job","title company location type deadline").sort({appliedAt:-1})});}catch(e){next(e)}});
r.get("/admin/all",requireAuth,requireAdmin,async(_req,res,next)=>{try{res.json({applications:await Application.find().populate("student","name email department").populate("job","title company").sort({appliedAt:-1})});}catch(e){next(e)}});
r.patch("/:id/status",requireAuth,requireAdmin,async(req,res,next)=>{try{if(!["Pending","Shortlisted","Rejected","Selected"].includes(req.body.status))return res.status(400).json({message:"Invalid status."});const a=await Application.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true,runValidators:true}).populate("student","name email").populate("job","title company");if(!a)return res.status(404).json({message:"Application not found."});res.json({application:a});}catch(e){next(e)}});
r.get("/resume/:filename",requireAuth,async(req,res,next)=>{try{const a=await Application.findOne({resumePath:path.basename(String(req.params.filename))});if(!a)return res.status(404).json({message:"Resume not found."});if(String(a.student)!==String(req.user._id)&&req.user.role!=="admin")return res.status(403).json({message:"Not allowed."});const p=path.join(dir,path.basename(a.resumePath));if(!fs.existsSync(p))return res.status(404).json({message:"Resume file missing."});res.download(p);}catch(e){next(e)}});
export default r;
