import { createClient } from "@libsql/client";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // Always set JSON header
  res.setHeader("Content-Type", "application/json");

  const { action } = req.query;

  try {
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

      // Generate 6-digit random OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      // Store OTP and expiry in DB
      await db.execute({
        sql: `UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE LOWER(email) = LOWER(?)`,
        args: [otp, expiresAt, email]
      });

      // Send OTP via Resend (Using onboarding@resend.dev for safety if domain isn't verified)
      if (resend) {
        await resend.emails.send({
          from: "Nexus Pro <onboarding@resend.dev>",
          to: [email],
          subject: "Nexus Pro - Password Reset OTP",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Password Reset Request</h2>
              <p>Your 6-digit verification code for Nexus Pro is:</p>
              <h1 style="color: #0284c7; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you did not request a password reset, please ignore this email.</p>
            </div>
          `
        });
      } else {
        console.warn("RESEND_API_KEY is missing. OTP created in DB but email not sent.");
      }

      return res.status(200).json({ success: true, message: "OTP sent successfully." });
    }

    // 2. ACTION: Verify OTP & Change Password
    if (req.method === "POST" && action === "reset-password") {
      const { email, otp, newPassword } = req.body || {};

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, error: "All fields are required." });
      }

      // Retrieve user with valid OTP
      const userRes = await db.execute({
        sql: `SELECT id, reset_otp, reset_otp_expires FROM users WHERE LOWER(email) = LOWER(?)`,
        args: [email]
      });

      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid request." });
      }

      const user = userRes.rows[0];

      // Validate OTP match and expiration
      if (!user.reset_otp || String(user.reset_otp) !== String(otp)) {
        return res.status(400).json({ success: false, error: "Invalid OTP verification code." });
      }

      if (Date.now() > Number(user.reset_otp_expires)) {
        return res.status(400).json({ success: false, error: "OTP code has expired. Please request a new one." });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP fields
      await db.execute({
        sql: `UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE LOWER(email) = LOWER(?)`,
        args: [hashedPassword, email]
      });

      return res.status(200).json({ success: true, message: "Password reset successful." });
    }

    return res.status(400).json({ success: false, error: "Invalid action." });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ success: false, error: err.message || "An unexpected server error occurred." });
  }
}
