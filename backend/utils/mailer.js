const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  // CRITICAL: Force IPv4 ONLY. Render free tier has broken IPv6 routes.
  family: 4 
});

// Diagnostic to check if Render can even see Gmail
dns.lookup('smtp.gmail.com', { family: 4 }, (err, address) => {
  if (err) console.error('🌐 DNS Lookup Failed (IPv4) for Gmail:', err.message);
  else console.log('🌐 DNS Lookup Success (IPv4). Gmail is at:', address);
});

/**
 * Sends an HTML email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Fashion Hub 👗" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
  }
}

// ---- Email Templates ----

function orderConfirmationEmail(userName, orderId, items, total, address) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #ede8e0">${i.name || 'Product'}</td>
      <td style="padding:10px;border-bottom:1px solid #ede8e0;text-align:center">${i.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #ede8e0;text-align:right">₹${(i.price_at_purchase * i.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#2c2c2c,#4a5a32);padding:40px;text-align:center">
        <h1 style="color:white;font-size:28px;margin:0">Fashion<span style="color:#a3b86c">Hub</span></h1>
        <p style="color:rgba(255,255,255,0.8);margin-top:8px">Your order is confirmed! 🎉</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#2c2c2c">Hi <strong>${userName}</strong>,</p>
        <p style="color:#7a6f65">Thank you for shopping with Fashion Hub! Your order has been placed and will be shipped soon.</p>

        <div style="background:white;border-radius:12px;overflow:hidden;margin:24px 0;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
          <div style="padding:16px 20px;background:#6b7c4d;color:white;font-weight:600">Order Summary</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f5f2ed">
                <th style="padding:10px;text-align:left;font-size:13px;color:#7a6f65">ITEM</th>
                <th style="padding:10px;text-align:center;font-size:13px;color:#7a6f65">QTY</th>
                <th style="padding:10px;text-align:right;font-size:13px;color:#7a6f65">PRICE</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="padding:16px 20px;display:flex;justify-content:space-between;border-top:2px solid #ede8e0">
            <span style="font-weight:700;font-size:16px">Total</span>
            <span style="font-weight:700;font-size:16px;color:#6b7c4d">₹${total.toLocaleString()}</span>
          </div>
        </div>

        <p style="color:#7a6f65;font-size:14px"><strong>Shipping to:</strong> ${address}</p>
        <p style="color:#7a6f65;font-size:13px">Order ID: <code style="background:#ede8e0;padding:2px 6px;border-radius:4px">${orderId}</code></p>
      </div>
      <div style="background:#2c2c2c;padding:20px;text-align:center">
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">Fashion Hub © 2026 · by Isabel Mercado</p>
      </div>
    </div>
  `;
}

function tryOnOrderEmail(userName, productName, estimatedDelivery) {
  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#8c4a2f,#c9973b);padding:40px;text-align:center">
        <div style="font-size:48px">👗</div>
        <h1 style="color:white;font-size:24px;margin:8px 0">Sample Try-On Confirmed!</h1>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#2c2c2c">Hi <strong>${userName}</strong>,</p>
        <p style="color:#7a6f65">Your <strong>${productName}</strong> sample try-on order is confirmed and on its way! Our delivery partner will arrive within the estimated time.</p>
        <div style="background:white;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #c9973b">
          <div style="font-size:13px;color:#7a6f65;text-transform:uppercase;letter-spacing:0.06em">Estimated Delivery</div>
          <div style="font-size:24px;font-weight:700;color:#2c2c2c;margin-top:4px">${estimatedDelivery}</div>
        </div>
        <p style="color:#7a6f65;font-size:14px">After you try it on, log in to Fashion Hub to share your feedback — buy it, request alterations, or return the sample. No charge if you return!</p>
      </div>
      <div style="background:#2c2c2c;padding:20px;text-align:center">
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">Fashion Hub © 2026 · by Isabel Mercado</p>
      </div>
    </div>
  `;
}

function passwordResetEmail(userName, resetLink) {
  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#2c2c2c,#4a5a32);padding:40px;text-align:center">
        <h1 style="color:white;font-size:28px;margin:0">Fashion<span style="color:#a3b86c">Hub</span></h1>
        <p style="color:rgba(255,255,255,0.8);margin-top:8px">Password Reset Request 🔐</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#2c2c2c">Hi <strong>${userName}</strong>,</p>
        <p style="color:#7a6f65">We received a request to reset your Fashion Hub password. Click the button below to create a new password. This link is valid for <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:36px 0">
          <a href="${resetLink}" style="background:linear-gradient(135deg,#2c2c2c,#4a5a32);color:white;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.05em">Reset My Password →</a>
        </div>
        <p style="color:#7a6f65;font-size:13px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#7a6f65;font-size:12px;word-break:break-all">Or copy this link: <a href="${resetLink}" style="color:#6b7c4d">${resetLink}</a></p>
      </div>
      <div style="background:#2c2c2c;padding:20px;text-align:center">
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">Fashion Hub © 2026 · by Isabel Mercado</p>
      </div>
    </div>
  `;
}

function otpEmail(userName, otpCode) {
  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;background:#faf7f2;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#2c2c2c,#4a5a32);padding:40px;text-align:center">
        <h1 style="color:white;font-size:28px;margin:0">Fashion<span style="color:#a3b86c">Hub</span></h1>
        <p style="color:rgba(255,255,255,0.8);margin-top:8px">Your Login Code 🔐</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#2c2c2c">Hi <strong>${userName}</strong>,</p>
        <p style="color:#7a6f65">Use the following 6-digit code to verify your account and securely log in. This code is valid for <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <div style="display:inline-block;background:#ede8e0;color:#2c2c2c;font-size:36px;font-weight:700;letter-spacing:0.2em;padding:16px 32px;border-radius:12px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.05)">
            ${otpCode}
          </div>
        </div>
        <p style="color:#7a6f65;font-size:13px">If you didn't request this code, you can safely ignore this email.</p>
      </div>
      <div style="background:#2c2c2c;padding:20px;text-align:center">
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">Fashion Hub © 2026 · by Isabel Mercado</p>
      </div>
    </div>
  `;
}

module.exports = { sendMail, orderConfirmationEmail, tryOnOrderEmail, passwordResetEmail, otpEmail };
