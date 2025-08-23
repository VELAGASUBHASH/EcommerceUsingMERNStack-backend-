import Coupon from "../Model/CouponsModel.js";

export const getCoupons = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 });

    if (!coupon) {
      return res.status(404).json({ message: "No active coupon found" });
    }

    res.json({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error In Getting Coupon Code", error.message);
    res.status(500).json({ message: "Server Error In Coupon Getting", error: error.message });
  }
};

export const ValidateCoupons = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code, userId: req.user._id, isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon Not Found" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon Expired" });
    }

    res.json({
      message: "Coupon Is Valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error In Validating Coupon", error.message);
    res.status(500).json({ message: "Server Error In Coupon Validation", error: error.message });
  }
};
