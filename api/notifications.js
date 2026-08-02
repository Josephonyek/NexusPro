import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  const { action } = req.query;

  // 1. GET: Fetch Notifications
  if (req.method === "GET" && action === "get-notifications") {
    try {
      const email = req.query.email || "";

      const result = await db.execute({
        sql: `SELECT * FROM notifications WHERE recipient_type = 'all' OR recipient_email = ? ORDER BY id DESC`,
        args: [email]
      });

      return res.status(200).json({ success: true, notifications: result.rows });
    } catch (err) {
      console.error("Get notifications DB error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Send Broadcast Notification
  if (req.method === "POST" && action === "send-notification") {
    try {
      const { recipientType, recipientEmail, title, message } = req.body;

      if (!title || !message) {
        return res.status(400).json({ success: false, error: "Title and message are required." });
      }

      await db.execute({
        sql: `INSERT INTO notifications (recipient_type, recipient_email, title, message, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [recipientType, recipientType === "single" ? recipientEmail : null, title, message, Date.now()]
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Send notification error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ success: false, error: "Invalid action method" });
}
