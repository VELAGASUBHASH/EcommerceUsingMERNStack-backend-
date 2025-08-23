import {redis} from '../Library/redis.js';
import cloudinary from '../Library/cloudinary.js';
import Product from "../Model/ProductModel.js";
import { json } from 'express';

export const getAllProducts = async(req,res)=>{
    try {
        const products = await Product.find({});
        res.json({products});
    } catch (error) {
        console.log(`Error In getting All Products`,error);
        
    }

}

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredproducts = await redis.get("featured_products"); // use let instead of const

    if (featuredproducts) {
      return res.json(JSON.parse(featuredproducts)); // Redis stores strings
    }

    // If not in Redis, fetch from MongoDB
    featuredproducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredproducts || featuredproducts.length === 0) {
      return res.status(404).json({ message: "No Featured Product" });
    }

    // Store in Redis for next time
    await redis.set("featured_products", JSON.stringify(featuredproducts));

    res.json(featuredproducts); // send directly
  } catch (error) {
    console.error("Unable Fetch Products in Redis", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


export const createproduct = async(req,res)=>{
    try {
        const{name,description,price,image,category} = req.body;

        let cloudinaryRespone = null;
        if(image){
          cloudinaryRespone = await cloudinary.uploader.upload(image,{folder:"products"})
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryRespone?.secure_url ? cloudinaryRespone?.secure_url : " ",
            category
        })
        res.status(201).json({product,message:"Product Created Successfully"});
    } catch (error) {
        console.log("Error In Create Product",error.message);
        res.status(500).json({message:"Server Error",error:error.message});  
    }
};

export const deleteproduct = async (req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({messgae:"Product Does Not Found"});
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];// this will get image id 
            try {
                await cloudinary.uploader.destroy(`products/&${publicId}`);
                console.log("Deleted Image From Cloudinary");
            } catch (error) {
                console.log("Unable To Delete Image From Cloudinary",error);
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({messgae:"Product Deleted Successfully"});
    } catch (error) {
        console.log("Error In Deleting Product",error);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}

export const getRecommendationsProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 3 } },
      {
        $project: {              
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1
        }
      }
    ]);

    res.json(products); 
  } catch (error) {
    console.error("Error in getting Recommendation:", error.message);
    res.status(500).json({
      message: "Error in getting Recommendation",
      error: error.message
    });
  }
};


export const getproductsByCategory = async (req,res) => {
    const {category} = req.params;
    try {
        const products = await Product.find({category}) 
        res.json({products});
        
    } catch (error) {
        console.log("Error in Getting Category",error.message);
        res.status(500).json({message:"Server Error in Getting Category",error:error.message});

        
    }
}
export const toggleFeaturedProduct = async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedproduct = await product.save();
            await updatedFeaturedProductsCache();
            res.json(updatedproduct);
        }else{
            res.status(404).json({message:"Product not Found"});
        }
    } catch (error) {
        console.log("Error in getting Featured Products",error.message);
        res.status(500).json({message:"Server Error",error:error.message});
    }
}

async function updatedFeaturedProductsCache (){
    try {
        const featuredproducts = await Product.find({isFeatured: true}).lean();
        await redis.set("featured_products",JSON.stringify(featuredproducts));
    } catch (error) {
        console.log("error in update in cache function",error);
        
    }
}