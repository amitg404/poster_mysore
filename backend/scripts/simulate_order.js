const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Load from environment variables
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

if (!RAZORPAY_KEY_SECRET || !JWT_SECRET) {
    console.error("❌ Missing RAZORPAY_KEY_SECRET or JWT_SECRET in .env");
    process.exit(1);
}

async function main() {
    try {
        console.log("🚀 Starting Order Simulation...");

        // 1. Get a User
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No users found in DB. Please signup first.");
            return;
        }
        console.log(`👤 Using User: ${user.email} (${user.id})`);

        // 2. Generate Token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // 1.5 Get a Real Product
        const product = await prisma.product.findFirst();
        if (!product) {
            console.error("No products found in DB.");
            return;
        }

        // 3. Prepare Mock Data
        const orderId = `order_${Date.now()}`;
        const paymentId = `pay_${Date.now()}`;
        const amount = 9; // JUST9 Price

        // 4. Generate Signature
        const body = orderId + "|" + paymentId;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const payload = {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            amount: amount,
            dropZone: "SJCE",
            items: [
                { 
                    quantity: 1, 
                    product: { 
                        title: "Vietnam Pavilion", // Specific Poster 1
                        id: "4b64391e-fedf-4d90-859b-1e7dbdf91c16",
                        price: 9
                    } 
                },
                { 
                    quantity: 1, 
                    product: { 
                        title: "Spider Man Movie", // Specific Poster 2
                        id: "0564ba47-8523-49c8-b507-1fe456c70222",
                        price: 9
                    } 
                }
            ]
        };

        // 5. Call Verify Endpoint
        console.log("📡 Sending Verify Request...");
        const res = await axios.post('http://localhost:5000/api/payment/verify', payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ Simulation Result:", res.data);
        console.log("🔔 Ntfy Notification should have been sent.");

    } catch (e) {
        console.error("❌ Error:", e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
