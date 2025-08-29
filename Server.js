import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import AuthRoute from './Routes/AuthRoute.js';
import ProductRoute from './Routes/ProductRoute.js';
import CartRoute from './Routes/CartRoute.js';
import CouponsRoute from './Routes/CouponsRoute.js';
import PaymentRoute from './Routes/PaymentRoute.js';
import AnalyticsRoute from './Routes/AnalyticsRoute.js';
import cookieParser from "cookie-parser";
import path from 'path';

dotenv.config();
const app = express();
const __dirname = path.resolve();

const allowedOrigins = [
  "https://nodekart.vercel.app",
  "https://nodekart-git-main-velagasubhashs-projects.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: This origin is not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use("/auth", AuthRoute);
app.use("/products", ProductRoute);
app.use("/cart", CartRoute);
app.use("/coupons", CouponsRoute);
app.use("/payment", PaymentRoute);
app.use("/analytics", AnalyticsRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/Client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "Client", "dist", "index.html"));
  });
}

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Successfully Connected To MongoDB 👍"))
  .catch((error) => console.log("Error Connecting to MongoDB 😭", error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
