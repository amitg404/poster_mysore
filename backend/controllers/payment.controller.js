const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const { calculateCartTotal } = require('../utils/pricing');
const { sendOrderEmail } = require('../utils/emailService');

exports.createOrder = async (req, res) => {
    try {
        const { amount, couponCode } = req.body; // Amount from frontend (for verification), couponCode for discounts
        const userId = req.user.id;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        // 1. Calculate Secure Price Server-Side
        const { finalAmount } = await calculateCartTotal(userId, couponCode);

        // 2. Validate Amount
        // Allow a small buffer (e.g., 1 Rupee) for floating point weirdness, though we handle integers mostly.
        const diff = Math.abs(finalAmount - amount);
        if (diff > 1) {
            console.warn(`[Security] Price Mismatch! User: ${userId}. Client: ${amount}, Server: ${finalAmount}`);
            // We can either block or just FORCE the correct amount.
            // For better UX during this transition/sync, let's just use the SERVER amount.
            // But if it's vastly different, maybe alert?
            // "Compare CalculatedPrice vs req.body.amount. If they differ... reject or force."
            // Let's FORCE the server amount for security.
        }

        const options = {
            amount: Math.round(finalAmount * 100), // Convert to paise based on SERVER calculation
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) return res.status(500).json({ message: "Razorpay Error" });

        res.json({
            ...order,
            evaluatedAmount: finalAmount // Send back what the server decided
        });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            items, // Passed from frontend
            amount, // Total amount
            dropZone, // Shipping info
            email // Email from checkout form
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            
            // 1. Create Order in Database
            const userId = req.user.id; 

            // Format items for Prisma
            const orderItemsData = items.map(item => ({
                productId: item.product.id || item.productId, 
                quantity: item.quantity,
                price: item.product.price, 
                customImage: item.customImage || null
            }));

            const finalStatus = `PAID (${dropZone})`;

            const newOrder = await prisma.order.create({
                data: {
                    userId: userId,
                    totalAmount: amount,
                    finalAmount: amount, 
                    shippingFee: 0, 
                    status: "PAID",
                    paymentId: razorpay_payment_id,
                    items: {
                       create: orderItemsData
                    },
                    status: finalStatus
                }
            });

            // --- NTFY NOTIFICATION ---
            try {
                // Fetch full user details
                const user = await prisma.user.findUnique({ where: { id: userId } });
                
                const itemList = items.map(i => `${i.quantity}x ${i.product.title}`).join(', ');
                const message = `💰 New Order! ₹${amount}\n👤 ${user?.name || 'Unknown'} (${user?.mobile || user?.email || 'No Contact'})\n📍 ${dropZone}\n📦 ${itemList}`;

                await axios.post('https://ntfy.sh/poster_shop_35678_xc_45', message, {
                    headers: {
                        'Title': 'New PosterShop Order 🚀',
                        'Tags': 'moneybag,tada',
                        'Priority': 'high'
                    }
                });
                console.log("✅ Ntfy notification sent");
            } catch (notifyErr) {
                console.error("❌ Failed to send Ntfy notification:", notifyErr.message);
                // Don't block the response
            }
            // --- EMAIL NOTIFICATION ---
            let emailSent = false;
            try {
                let user = await prisma.user.findUnique({ where: { id: userId } });
                
                // If user has no email but provided one at checkout, update DB
                if (user && !user.email && email) {
                    user = await prisma.user.update({
                        where: { id: userId },
                        data: { email: email }
                    });
                    console.log(`[Checkout] Updated User Email to ${email}`);
                }

                if (user && user.email) {
                    await sendOrderEmail(user.email, {
                        amount,
                        orderId: razorpay_order_id,
                        items,
                        dropZone
                    });
                    emailSent = true;
                }
            } catch (emailErr) {
                console.error("❌ Failed to send Order Email:", emailErr.message);
            }
            // -------------------------

            res.json({
                message: "Payment success",
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                dbOrderId: newOrder.id,
                emailSent: emailSent
            });
        } else {
            res.status(400).json({
                message: "Invalid signature",
            });
        }
    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        res.status(500).send(error);
    }
};

exports.getRazorpayKey = (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
};
