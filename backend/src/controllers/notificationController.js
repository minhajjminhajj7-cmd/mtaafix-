const pool = require("../config/database");

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, incident_id, title, message, notification_type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      unread: result.rows.filter((item) => item.is_read === false).length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve notifications" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ success: false, message: "Unable to update notification" });
  }
};

module.exports = { getNotifications, markNotificationRead };
