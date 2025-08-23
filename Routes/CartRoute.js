import express from 'express';
import { AddToCart,RemoveFromCart , UpdateQuantity,GetCartProducts} from '../Controller/CartController.js';
import { protectRoute } from '../Middleware/AuthMiddleware.js';
const router = express.Router();

router.get("/",protectRoute,GetCartProducts);
router.post("/",protectRoute,AddToCart);
router.delete("/",protectRoute,RemoveFromCart);
router.put("/:id",protectRoute,UpdateQuantity);

export default router;