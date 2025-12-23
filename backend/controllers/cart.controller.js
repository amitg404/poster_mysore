const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Cart Items
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartItems = await prisma.cartItem.findMany({
      where: { userId }
    });

    // Fetch product details for each item
    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        return {
          ...item,
          product: product ? {
            ...product,
            images: JSON.parse(product.images)
          } : null
        };
      })
    );

    // Calculate totals
    let subtotal = 0;
    itemsWithDetails.forEach(item => {
      if (item.product) {
        subtotal += item.product.price * item.quantity;
      }
    });

    const shippingFee = subtotal >= 299 ? 0 : 30;
    const total = subtotal + shippingFee;

    res.json({
      items: itemsWithDetails,
      subtotal,
      shippingFee,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add to Cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, customImage } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId, productId }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        userId,
        productId,
        quantity,
        customImage
      }
    });

    res.json({ message: 'Added to cart', cartItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Cart Item Quantity
exports.updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      // Remove item if quantity is 0
      await prisma.cartItem.delete({ where: { id: itemId } });
      return res.json({ message: 'Item removed' });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Try deleting by CartItem ID (primary key) & Ensure ownership
    const result = await prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        userId: userId 
      }
    });

    if (result.count === 0) {
       // Fallback: The frontend might have sent a ProductID if it wasn't synced.
       // Try deleting where productId == itemId
       await prisma.cartItem.deleteMany({
           where: {
               productId: itemId,
               userId: userId
           }
       });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
