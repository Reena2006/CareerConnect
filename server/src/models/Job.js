import mongoose from "mongoose";
const schema = new mongoose.Schema({
 title:{type:String,required:true,trim:true,maxlength:120},
 company:{type:String,required:true,trim:true},
 location:{type:String,required:true,trim:true},
 type:{type:String,enum:["Internship","Full-time","Part-time"],default:"Internship"},
 description:{type:String,required:true,trim:true,maxlength:5000},
 skills:{type:[String],default:[]}, deadline:{type:Date,default:null},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 createdAt:{type:Date,default:Date.now}
});
export default mongoose.model("Job",schema);
