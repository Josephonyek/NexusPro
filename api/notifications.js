import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  const { action } = req.query;

  // 1. GET: Notifications for Student (with read state)
  if (req.method === "GET" && action === "get-notifications") {
    try {
      const email = req.query.email || "";
      const result = await db.execute({
        sql: `SELECT n.*, CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_seen 
              FROM notifications n 
              LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.student_email = ? 
              WHERE n.recipient_type = 'all' OR n.recipient_email = ? 
              ORDER BY n.id DESC`,
        args: [email, email]
      });
      return res.status(200).json({ success: true, notifications: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Mark Notification as Seen by Student
  if (req.method === "POST" && action === "mark-seen") {
    try {
      const { notification_id, student_email } = req.body;
      await db.execute({
        sql: `INSERT OR IGNORE INTO notification_reads (notification_id, student_email, read_at) VALUES (?, ?, ?)`,
        args: [notification_id, student_email, Date.now()]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. GET: Admin Listing (Includes total seen count per notification)
  if (req.method === "GET" && action === "admin-list") {
    try {
      const result = await db.execute(`
        SELECT n.*, COUNT(nr.id) as read_count 
        FROM notifications n 
        LEFT JOIN notification_reads nr ON n.id = nr.notification_id 
        GROUP BY n.id 
        ORDER BY n.id DESC
      `);
      return res.status(200).json({ success: true, notifications: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. GET: List of specific students who read a notification
  if (req.method === "GET" && action === "get-reads") {
    try {
      const { id } = req.query;
      const result = await db.execute({
        sql: `SELECT student_email, read_at FROM notification_reads WHERE notification_id = ? ORDER BY read_at DESC`,
        args: [id]
      });
      return res.status(200).json({ success: true, reads: result.rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 5. POST: Send Notification
  if (req.method === "POST" && action === "send-notification") {
    try {
      const { recipientType, recipientEmail, title, message } = req.body;
      await db.execute({
        sql: `INSERT INTO notifications (recipient_type, recipient_email, title, message, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [recipientType || "all", recipientEmail || null, title, message, Date.now()]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 6. POST: Edit Notification
  if (req.method === "POST" && action === "edit-notification") {
    try {
      const { id, title, message } = req.body;
      await db.execute({
        sql: `UPDATE notifications SET title = ?, message = ? WHERE id = ?`,
        args: [title, message, id]
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 7. POST: Delete Notification & its Read Logs
  if (req.method === "POST" && action === "delete-notification") {
    try {
      const { id } = req.body;
      await db.execute({ sql: `DELETE FROM notification_reads WHERE notification_id = ?`, args: [id] });
      await db.execute({ sql: `DELETE FROM notifications WHERE id = ?`, args: [id] });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(400).json({ error: "Invalid action" });
}
