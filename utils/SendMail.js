import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendWelcomeMail = async (to, name) => {
  const mailOptions = {
    from: `"NodeCart" <${process.env.MAIL_USER}>`,
    to,
    subject: '🎉 Welcome to Our Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">Welcome, ${name} 🎉</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            We're thrilled to have you join our community! 😊<br/><br/>
            This is the beginning of something awesome. Dive in, explore, and make the most of everything we offer.
          </p>
          <a href="https://yourwebsite.com" style="display: inline-block; margin: 20px auto; padding: 12px 25px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Get Started
          </a>
          <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
            If you have any questions, feel free to reply to this email. We're here to help!
          </p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            &copy; ${new Date().getFullYear()} NodeCart. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendVerificationMail = async (to, name, code) => {
  const mailOptions = {
    from: `"NodeCart" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Verify Your Email - 6 Digit Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="text-align:center;">👋 Hello ${name},</h2>
          <p style="font-size: 16px;">Thanks for signing up! Please use the following verification code to complete your registration:</p>
          <div style="text-align:center; margin: 20px 0;">
            <h1 style="background-color:#007BFF; color:white; display:inline-block; padding:10px 20px; border-radius:8px;">${code}</h1>
          </div>
          <p style="font-size: 14px; color:#777;">This code will expire in 10 minutes.</p>
          <p style="text-align:center; font-size:12px; color:#aaa;">&copy; ${new Date().getFullYear()} NodeCart</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationMail = async (to, name, orderDetails) => {
  const { orderId, items, totalAmount, shippingAddress, date } = orderDetails;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #eee;">₹${item.price}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"NodeCart" <${process.env.MAIL_USER}>`,
    to,
    subject: `🛒 Order Confirmed - Order #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="text-align: center; color: #4CAF50;">✅ Order Confirmed!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for your purchase. Your order <strong>#${orderId}</strong> has been confirmed on <strong>${date}</strong>.</p>

          <h3 style="margin-top: 30px;">📦 Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 8px; border: 1px solid #eee;">Item</th>
                <th style="padding: 8px; border: 1px solid #eee;">Qty</th>
                <th style="padding: 8px; border: 1px solid #eee;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <p style="margin-top: 20px;"><strong>Total Amount:</strong> ₹${totalAmount}</p>

          <h3 style="margin-top: 30px;">🚚 Shipping Address</h3>
          <p>${shippingAddress}</p>

          <p style="margin-top: 30px;">We’ll notify you once your order is shipped. If you have any questions, reply to this email.</p>

          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} NodeCart. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
