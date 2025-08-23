import express from 'express';
import {signup,login,logout,verifyEmail,refreshToken,getProfile} from '../Controller/AuthController.js';
import {protectRoute} from "../Middleware/AuthMiddleware.js";
const router = express.Router();

router.post("/signup",signup);
router.post("/verify-email", verifyEmail);
router.post("/login",login);
router.post("/logout",logout);
router.post("/refresh-token", refreshToken);
router.get("/profile",protectRoute,getProfile);

export default router;