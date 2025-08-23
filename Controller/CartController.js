import Product from "../Model/ProductModel.js";

export const GetCartProducts = async (req, res) => {
  try {
    const cartItems = req.user.cartItems || [];

    const productIds = cartItems.map(item => item.id);
    const products = await Product.find({ _id: { $in: productIds } });

    const fullCart = products.map(product => {
      const match = cartItems.find(ci => ci.id.toString() === product._id.toString());
      return {
        ...product.toObject(),
        quantity: match?.quantity || 1
      };
    });

    res.status(200).json(fullCart);
  } catch (error) {
    console.error("Cart fetch error:", error.message);
    res.status(500).json({ message: "Failed to get cart", error: error.message });
  }
};

export const AddToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Ensure cartItems is always an array
        if (!user.cartItems) {
            user.cartItems = [];
        }

        const existingItem = user.cartItems.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cartItems.push({
                id: productId,
                quantity: 1
            });
        }

        await user.save();
        res.status(200).json({ message: "Item added to cart", cart: user.cartItems });

    } catch (error) {
        console.error("Error in adding items to cart:", error.message);
        res.status(500).json({ message: "Server error in adding items", error: error.message });
    }
};


export const RemoveFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter(item => item.id.toString() !== productId);
    }

    await user.save();
    res.status(200).json({ message: "Cart updated", cart: user.cartItems });
  } catch (error) {
    console.error("Error removing from cart:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const UpdateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(item => item.id.toString() === productId);
    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(item => item.id.toString() !== productId);
      } else {
        existingItem.quantity = quantity;
      }
      await user.save();
      return res.status(200).json(user.cartItems);
    }

    return res.status(404).json({ message: "Item not found in cart" });
  } catch (error) {
    console.log("Update error:", error.message);
    res.status(500).json({ message: "Unable to update cart", error: error.message });
  }
};
