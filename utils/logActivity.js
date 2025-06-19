// utils/logActivity.js
const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'UnifiedMessaging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const logActivity = async (currentUser, actionType, tableName, description) => {
  try {
    const userId = currentUser?.userId || null;
    const username = currentUser?.username || 'Unknown';

    const [result] = await connection.query(
      'INSERT INTO activity_log (userId, action, description, username) VALUES (?, ?, ?, ?)',
      [userId, actionType, description, username]
    );
    console.log('Activity logged successfully.');
    return true;
  } catch (error) {
    console.error('❌ Failed to log activity:', error.message);
    return false;
  }
};

module.exports = { logActivity };
