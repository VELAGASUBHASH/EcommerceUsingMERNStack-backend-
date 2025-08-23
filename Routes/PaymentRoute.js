import express from 'express';
import { protectRoute } from '../Middleware/AuthMiddleware.js';
import { createCheckoutSession,checkoutSuccess } from '../Controller/PaymentController.js';

const router = express.Router();

router.post("/create-checkout-session", protectRoute,createCheckoutSession);
router.post("/checkout-success",protectRoute,checkoutSuccess);
export default router;
