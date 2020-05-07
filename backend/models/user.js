const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    followers:[{
        type:ObjectId,
        ref:"User"
    }],
    pic:{
        type:String,
        default:"https://res.cloudinary.com/ketancloud/image/upload/v1588848237/No_image_pic_jspzfv.png"
    },
    following:[{
        type:ObjectId,
        ref:"User"
    }]
})

mongoose.model("User",userSchema);