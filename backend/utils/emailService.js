const nodemailer = require('nodemailer');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD 
  }
});

/**
 * Send Order Confirmation Email
 * @param {string} to - Recipient email
 * @param {object} orderDetails - Order object (amount, id, items)
 */
exports.sendOrderEmail = async (to, orderDetails) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("⚠️ SMTP credentials missing. Skipping email.");
    return;
  }

  const { amount, orderId, items, dropZone } = orderDetails;
  
  // Automation-friendly format: ID: <uuid>
  const itemListHtml = items.map(i => `
    <li style="margin-bottom: 10px;">
      ${i.quantity}x <strong>${i.product.title}</strong>
      <br/>
      <span style="font-family: monospace; font-size: 10px; color: #888;">ID: ${i.product.id}</span>
      ${i.customImage ? `<br/><span style="font-size:10px; color:#22c55e;">[Custom Image Included]</span>` : ''}
    </li>
  `).join('');

  const mailOptions = {
    from: `"PosterShop Mysore" <${process.env.SMTP_EMAIL}>`,
    to: to,
    // Subject MUST contain "Print Order" for automation script filter
    subject: `Print Order: #${orderId.slice(-6)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #22c55e;">Print Order Confirmed! 🖨️</h2>
        <p>Thank you for your order. We are preparing it for delivery to <strong>${dropZone || 'SJCE'}</strong>.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> ₹${amount}</p>
          <ul>
            ${itemListHtml}
          </ul>
        </div>

        <p style="font-size: 0.9em; color: #666;">
          Need help? Reply to this email or contact us on WhatsApp.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email failed:", error.message);
  }
};
