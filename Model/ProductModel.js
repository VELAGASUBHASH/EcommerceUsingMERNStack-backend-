import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
        maxlength:200
    },
    price:{
        type:Number,
        required:true,
        min:0,
    },
    image:{
        type:String,
        required:[true,"Image is Requried"]
    },
    category:{
        type:String,
        required:true
    },
    isFeatured:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

const Product = mongoose.model("product",productSchema);

export default Product;