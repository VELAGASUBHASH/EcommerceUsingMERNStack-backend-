import express from 'express';
import {getAllProducts,getFeaturedProducts,createproduct,deleteproduct,getRecommendationsProducts,getproductsByCategory,toggleFeaturedProduct} from '../Controller/ProductController.js';
import {protectRoute,adminRoute} from '../Middleware/AuthMiddleware.js';

const router = express.Router();

router.get("/",protectRoute,adminRoute,getAllProducts);
router.get("/featured",getFeaturedProducts);
router.get("/category/:category",getproductsByCategory);
router.get("/recommendations",getRecommendationsProducts);
router.post("/",protectRoute,adminRoute,createproduct);
router.patch("/:id",protectRoute,adminRoute,toggleFeaturedProduct);
router.delete("/:id",protectRoute,adminRoute,deleteproduct);

export default router;