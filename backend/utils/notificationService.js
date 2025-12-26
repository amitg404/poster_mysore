const axios = require('axios');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

/**
 * Send Telegram notification
 */
exports.sendTelegramNotification = async (message) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
        console.log("⚠️ Telegram not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)");
        return false;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
        console.log("✅ Telegram notification sent");
        return true;
    } catch (error) {
        console.error("❌ Telegram notification failed:", error.response?.data || error.message);
        return false;
    }
};

/**
 * Send Admin Email notification for new order
 */
exports.sendAdminOrderEmail = async (orderData) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
        console.log("⚠️ ADMIN_EMAIL not configured");
        return false;
    }

    const { amount, orderId, items, dropZone, customerName, customerContact } = orderData;
    
    const itemList = items.map(i => `• ${i.quantity}x ${i.product?.title || 'Unknown'} - ₹${i.product?.price || 0}`).join('\n');

    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: adminEmail,
        subject: `🛒 New Order! ₹${amount} - ${customerName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">💰 New Order Received!</h1>
                </div>
                
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #111; margin-top: 0;">Order Details</h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Amount:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #22c55e;">₹${amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Order ID:</td>
                            <td style="padding: 8px 0;">${orderId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Customer:</td>
                            <td style="padding: 8px 0;">${customerName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Contact:</td>
                            <td style="padding: 8px 0;">${customerContact}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;">Drop Zone:</td>
                            <td style="padding: 8px 0; font-weight: bold;">${dropZone}</td>
                        </tr>
                    </table>
                    
                    <h3 style="color: #111; margin-top: 20px;">Items Ordered:</h3>
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <pre style="margin: 0; white-space: pre-wrap;">${itemList}</pre>
                    </div>
                </div>
                
                <div style="background: #111; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
                    <p style="color: #888; margin: 0; font-size: 12px;">PosterShop Order Notification System</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Admin email sent to", adminEmail);
        return true;
    } catch (error) {
        console.error("❌ Admin email failed:", error.message);
        return false;
    }
};

/**
 * Send all notifications for a new order
 */
exports.notifyNewOrder = async (orderData) => {
    const { amount, orderId, items, dropZone, customerName, customerContact } = orderData;
    
    const itemList = items.map(i => `${i.quantity}x ${i.product?.title || 'Unknown'}`).join(', ');
    
    // Telegram message
    const telegramMessage = `
🛒 <b>New Order!</b>

💰 <b>Amount:</b> ₹${amount}
👤 <b>Customer:</b> ${customerName}
📞 <b>Contact:</b> ${customerContact}
📍 <b>Drop Zone:</b> ${dropZone}

📦 <b>Items:</b>
${itemList}

🆔 <b>Order ID:</b> <code>${orderId}</code>
    `.trim();

    // Send both notifications in parallel
    const results = await Promise.allSettled([
        this.sendTelegramNotification(telegramMessage),
        this.sendAdminOrderEmail(orderData)
    ]);

    return {
        telegram: results[0].status === 'fulfilled' && results[0].value,
        email: results[1].status === 'fulfilled' && results[1].value
    };
};
