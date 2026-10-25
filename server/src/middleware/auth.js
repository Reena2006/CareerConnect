import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function requireAuth(req,res,next){
 try{
  const h=req.headers.authorization||"", token=h.startsWith("Bearer ")?h.slice(7):"";
  if(!token)return res.status(401).json({message:"Please log in first."});
  const p=jwt.verify(token,process.env.JWT_SECRET);
  const user=await User.findById(p.id).select("-passwordHash");
  if(!user)return res.status(401).json({message:"Account no longer exists."});
  req.user=user;next();
 }catch{return res.status(401).json({message:"Invalid or expired session."});}
}
export function requireAdmin(req,res,next){
 if(req.user?.role!=="admin")return res.status(403).json({message:"Administrator access required."});
 next();
}
