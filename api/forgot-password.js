import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Always enforce JSON content type output
  res.setHeader("Content-Type", "application/json");

  const { action } = req.query;

  try {
    // 1. Initialize Turso DB Client
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // 2. Safe Auto-Migrations
    // Ensure 'password_hash' column exists
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
    } catch (e) {
      // Ignore if column already exists
    }

    // Ensure 'reset_otp' column exists
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) DEFAULT NULL;`);
    } catch (e) {
      // Ignore if column already exists
    }

    // Ensure 'reset_otp_expires' column exists
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN reset_otp_expires BIGINT DEFAULT NULL;`);
    } catch (e) {
      // Ignore if column already exists
    }

    const brevoApiKey = process.env.BREVO_API_KEY;

    // ==========================================
    // ACTION 1: REQUEST OTP CODE
    // ==========================================
    if (req.method === "POST" && action === "request-otp") {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({ success: false, error: "Email address is required." });
      }

      // Verify user exists in database
      const userRes = await db.execute({
        sql: `SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "No account found with this email address." });
      }

      // Generate random 6-digit numeric OTP and set 10-minute expiry
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; 

      // Save generated OTP and expiry timestamp to Turso DB
      await db.execute({
        sql: `UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE LOWER(email) = LOWER(?)`,
        args: [otp, expiresAt, email]
      });

      // Verify Brevo API key exists in Vercel environment variables
      if (!brevoApiKey) {
        return res.status(500).json({
          success: false,
          error: "BREVO_API_KEY environment variable is not configured in Vercel."
        });
      }

      // Send OTP transactional email via Brevo REST API
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
            email: "onyekajoseph001@gmail.com" 
          },
          to: [{ email: email }],
          subject: "Nexus Pro - Password Reset OTP",
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #0284c7; margin-bottom: 8px;">Password Reset Request</h2>
              <p style="font-size: 15px; color: #475569;">Your 6-digit verification code for Nexus Pro is:</p>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; display: inline-block; margin: 16px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${otp}</span>
              </div>
              <p style="font-size: 14px; color: #64748b;">This code will expire in <strong>10 minutes</strong>.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
          `
        })
      });

      const brevoData = await brevoRes.json();

      if (!brevoRes.ok) {
        console.error("Brevo Delivery Error:", brevoData);
        return res.status(400).json({
          success: false,
          error: brevoData.message || "Failed to deliver OTP via Brevo."
        });
      }

      return res.status(200).json({ success: true, message: "OTP sent successfully." });
    }

    // ==========================================
    // ACTION 2: VERIFY OTP & RESET PASSWORD
    // ==========================================
    if (req.method === "POST" && action === "reset-password") {
      const { email, otp, newPassword } = req.body || {};

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: "All fields are required." });
      }

      // Get stored OTP data for user
      const userRes = await db.execute({
        sql: `SELECT id, reset_otp, reset_otp_expires FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid request or account not found." });
      }

      const user = userRes.rows[0];

      // Verify OTP match
      if (!user.reset_otp || String(user.reset_otp) !== String(otp)) {
        return res.status(400).json({ success: false, error: "Invalid OTP code." });
      }

      // Verify OTP expiration timestamp
      if (Date.now() > Number(user.reset_otp_expires)) {
        return res.status(400).json({ success: false, error: "OTP code has expired. Please request a new one." });
      }

      // Hash new password using bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // UPDATE 'password_hash' AND CLEAR OTP FIELDS
      await db.execute({
        sql: `UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE LOWER(email) = LOWER(?)`,
        args: [hashedPassword, email]
      });

      return res.status(200).json({ success: true, message: "Password updated successfully." });
    }

    // Fallback for unsupported actions/routes
    return res.status(400).json({ success: false, error: "Invalid or missing action parameter." });

  } catch (err) {
    console.error("Critical Backend API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error." });
  }
}
