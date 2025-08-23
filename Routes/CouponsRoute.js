import express from 'express';
import { protectRoute } from '../Middleware/AuthMiddleware.js';
import { getCoupons, ValidateCoupons } from '../Controller/CouponsController.js';

const router = express.Router();

router.get("/", protectRoute, getCoupons);
router.post("/Validate", protectRoute, ValidateCoupons);

export default router;
