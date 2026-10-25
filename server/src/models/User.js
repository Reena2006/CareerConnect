import mongoose from "mongoose";
const schema = new mongoose.Schema({
 name:{type:String,required:true,trim:true,maxlength:100},
 email:{type:String,required:true,unique:true,lowercase:true,trim:true},
 passwordHash:{type:String,required:true},
 role:{type:String,enum:["student","admin"],default:"student"},
 department:{type:String,default:""},
 skills:{type:[String],default:[]},
 createdAt:{type:Date,default:Date.now}
});
export default mongoose.model("User",schema);
