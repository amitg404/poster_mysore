const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Order (Checkout)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { affiliateCode } = req.body;

    // 1. Fetch Cart Items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 2. Fetch Product Details & Calculate Subtotal
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product) continue;

      subtotal += product.price * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        customImage: item.customImage
      });
    }

    // 3. Shipping Logic (Free > ₹299)
    const shippingFee = subtotal >= 299 ? 0 : 30;

    // 4. Affiliate Discount Logic (10% off if valid code)
    let discountAmount = 0;
    let validAffiliate = null;

    if (affiliateCode) {
      if (affiliateCode.toUpperCase() === 'JUST9') {
          // Special Override
          // Recalculate everything to result in 9rs total
          // We can just set a special flag or force the final calculation
          // Better: Apply massive discount to reach 9rs
           const targetPrice = 9;
           // If subtotal + shipping is already < 9 (unlikely), do nothing?
           // Assuming we want TOTAL to be 9.
           const currentTotal = subtotal + shippingFee;
           if (currentTotal > targetPrice) {
               discountAmount = currentTotal - targetPrice;
           }
      } else {
        validAffiliate = await prisma.user.findUnique({
            where: { affiliateCode: affiliateCode.toUpperCase() }
        });

        if (validAffiliate && validAffiliate.role === 'AFFILIATE') {
            discountAmount = subtotal * 0.10; // 10% discount
        }
      }
    }

    // 5. Final Amount
    const finalAmount = subtotal - discountAmount + shippingFee;

    // 6. Create Order
    const order = await prisma.order.create({
      data: {
        userId,
        affiliateCode: validAffiliate ? affiliateCode.toUpperCase() : null,
        totalAmount: subtotal,
        shippingFee,
        discountAmount,
        finalAmount,
        status: 'PENDING',
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    // 7. Credit Affiliate Wallet (if applicable)
    if (validAffiliate) {
      const commission = subtotal * validAffiliate.commissionRate;
      await prisma.user.update({
        where: { id: validAffiliate.id },
        data: {
          walletBalance: { increment: commission }
        }
      });
    }

    // 8. Clear Cart
    await prisma.cartItem.deleteMany({ where: { userId } });

    res.json({
      message: 'Order created successfully!',
      order,
      discountApplied: discountAmount > 0,
      affiliateCredits: validAffiliate ? subtotal * validAffiliate.commissionRate : 0
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during checkout' });
  }
};

// Get User Orders
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { 
        items: {
          include: {
            product: true
          }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
