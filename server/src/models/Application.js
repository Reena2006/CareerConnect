import mongoose from "mongoose";
const schema = new mongoose.Schema({
 student:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 job:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true},
 resumePath:{type:String,default:""}, coverLetter:{type:String,default:"",maxlength:2000},
 status:{type:String,enum:["Pending","Shortlisted","Rejected","Selected"],default:"Pending"},
 appliedAt:{type:Date,default:Date.now}
});
schema.index({student:1,job:1},{unique:true});
export default mongoose.model("Application",schema);
