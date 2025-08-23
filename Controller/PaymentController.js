import Order from "../Model/OrderModel.js";
import Coupon from "../Model/CouponsModel.js";
import { stripe } from "../Library/Stripe.js";
import { sendOrderConfirmationMail } from "../utils/SendMail.js";
import User from "../Model/AuthModel.js"; 
import Product from "../Model/ProductModel.js";

import dotenv from "dotenv";

dotenv.config();

// ------------------------
// CREATE CHECKOUT SESSION
// ------------------------
export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let totalAmount = 0;

    const line_items = products.map((product) => {
      const amount = Math.round(product.price * 100); // in paisa
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            images: [product.image || ""],
          },
          unit_amount: amount,
        },
        quantity: product.quantity,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });

      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const stripeCouponId = coupon
      ? await createStripeCoupon(coupon.discountPercentage)
      : null;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.client_url}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.client_url}/cancel`,
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // ✅ If user paid over 10K, give a coupon
    if (totalAmount > 10000) {
      await createNewCoupon(req.user._id);
    }

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ------------------------
// STRIPE COUPON CREATOR
// ------------------------
async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

// ------------------------
// CREATE NEW USER COUPON
// ------------------------
async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({userId});
  const existing = await Coupon.findOne({ userId, isActive: true });
  if (existing) return;

  const newCoupon = new Coupon({
    code: "WELCOME" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId,
  });

  await newCoupon.save();
}

// ------------------------
// PAYMENT SUCCESS CALLBACK
// ------------------------
export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingOrder._id,
      });
    }

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      // ✅ Send order confirmation mail
      const user = await User.findById(session.metadata.userId);
      const productDetails = await Promise.all(
        products.map(async (item) => {
          const prod = await Product.findById(item.id);
          return {
            name: prod?.name || "Unknown Product",
            quantity: item.quantity,
            price: item.price,
          };
        })
      );

      await sendOrderConfirmationMail(user.email, user.name, {
        orderId: newOrder._id,
        date: new Date().toLocaleDateString(),
        totalAmount: session.amount_total / 100,
        shippingAddress: user.address || "Not Provided",
        items: productDetails,
      });

      return res.status(200).json({
        success: true,
        message: "Payment Successful",
        orderId: newOrder._id,
      });
    } else {
      return res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Error In Processing Payment", error);
    return res.status(500).json({
      message: "Payment processing error",
      error: error.message,
    });
  }
};
