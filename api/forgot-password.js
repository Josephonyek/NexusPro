import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Always return JSON headers
  res.setHeader("Content-Type", "application/json");

  const { action } = req.query;

  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const brevoApiKey = process.env.BREVO_API_KEY;

    // 1. ACTION: Request OTP Code
    if (req.method === "POST" && action === "request-otp") {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({ success: false, error: "Email address is required." });
      }

      // Check if student email exists in users table
      const userRes = await db.execute({
        sql: `SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "No account found with this email address." });
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      // Store OTP and expiration in DB
      await db.execute({
        sql: `UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE LOWER(email) = LOWER(?)`,
        args: [otp, expiresAt, email]
      });

      // Verify Brevo Key exists
      if (!brevoApiKey) {
        return res.status(500).json({
          success: false,
          error: "BREVO_API_KEY environment variable is missing in Vercel."
        });
      }

      // Send OTP via Brevo Transactional Email API
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { 
            name: "Nexus Pro Security", 
            email: "josephugo321@gmail.com" // You can set any sender email here
          },
          to: [{ email: email }],
          subject: "Nexus Pro - Password Reset OTP",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
              <h2 style="color: #0284c7; margin-bottom: 8px;">Password Reset Request</h2>
              <p style="font-size: 15px; color: #475569;">Your 6-digit verification code for Nexus Pro is:</p>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; display: inline-block; margin: 16px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otp}</span>
              </div>
              <p style="font-size: 14px; color: #64748b;">This code will expire in <strong>10 minutes</strong>.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not request this, you can safely ignore this email.</p>
            </div>
          `
        })
      });

      const brevoData = await brevoRes.json();

      if (!brevoRes.ok) {
        console.error("Brevo Error:", brevoData);
        return res.status(400).json({
          success: false,
          error: brevoData.message || "Failed to send email via Brevo."
        });
      }

      return res.status(200).json({ success: true, message: "OTP sent successfully." });
    }

    // 2. ACTION: Verify OTP & Change Password
    if (req.method === "POST" && action === "reset-password") {
      const { email, otp, newPassword } = req.body || {};

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: "All fields are required." });
      }

      // Retrieve user record
      const userRes = await db.execute({
        sql: `SELECT id, reset_otp, reset_otp_expires FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid request." });
      }

      const user = userRes.rows[0];

      // Validate OTP match & timing
      if (!user.reset_otp || String(user.reset_otp) !== String(otp)) {
        return res.status(400).json({ success: false, error: "Invalid OTP code." });
      }

      if (Date.now() > Number(user.reset_otp_expires)) {
        return res.status(400).json({ success: false, error: "OTP code has expired. Please request a new one." });
      }

      // Hash new password and clear OTP fields
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.execute({
        sql: `UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE LOWER(email) = LOWER(?)`,
        args: [hashedPassword, email]
      });

      return res.status(200).json({ success: true, message: "Password updated successfully." });
    }

    return res.status(400).json({ success: false, error: "Invalid action." });

  } catch (err) {
    console.error("Critical API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error." });
  }
}
