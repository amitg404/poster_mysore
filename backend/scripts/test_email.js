const { sendOrderEmail } = require('../utils/emailService');
require('dotenv').config();

const TARGET_EMAIL = "bestpersonal8@gmail.com"; 

async function main() {
    console.log(`📧 Testing Email to: ${TARGET_EMAIL}`);
    console.log(`🔑 Using Sender: ${process.env.SMTP_EMAIL || "MISSING"}`);

    try {
        await sendOrderEmail(TARGET_EMAIL, {
            amount: 9,
            orderId: `test_${Date.now()}`,
            items: [
                { 
                    quantity: 1, 
                    product: { 
                        title: "Test Poster",
                        id: "550e8400-e29b-41d4-a716-446655440000" // Mock valid UUID
                    } 
                }
            ],
            dropZone: "Test Zone"
        });
        console.log("✅ Email Function Executed.");
    } catch (e) {
        console.error("❌ Email Script Error:", e);
    }
}

main();
