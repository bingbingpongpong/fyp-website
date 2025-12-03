// pages/api/login.js
import { query, isMySQLAvailable, getDbPool } from '../../lib/db';

const issueSessionCookie = (res, username) => {
  const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
  const sessionValue = `${username}:${Date.now()}`;

  // NOTE: Intentionally omitting SameSite protection here to demonstrate CSRF.
  // In a real app you would want SameSite=Lax or Strict to mitigate CSRF.
  res.setHeader(
    'Set-Cookie',
    `adminSession=${sessionValue}; Path=/; Expires=${expires}`
  );
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    if (isMySQLAvailable()) {
      // Create users table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          email VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Add email column if it doesn't exist
      try {
        await query('ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL');
      } catch (e) {
        // Column already exists, ignore
      }

      // Insert default admin user if it doesn't exist
      try {
        await query(`
          INSERT IGNORE INTO users (username, password, role, email) 
          VALUES ('admin', 'admin123', 'admin', 'alice@GreenFactory.com')
        `);
      } catch (e) {
        // User might already exist, ignore
      }

      // Update admin user email to alice@GreenFactory.com
      try {
        await query(`
          UPDATE users 
          SET email = 'alice@GreenFactory.com' 
          WHERE username = 'admin'
        `);
      } catch (e) {
        // Ignore update errors
      }

      // ⚠️ VULNERABLE TO SQL INJECTION ⚠️
      // This query uses string concatenation instead of parameterized queries
      // DO NOT USE IN PRODUCTION - This is for educational/testing purposes only
      const sql = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
      
      console.log('Executing SQL:', sql); // For debugging - shows the vulnerability
      
      // Use pool.query() instead of pool.execute() to bypass prepared statements
      // This makes it vulnerable to SQL injection
      const pool = getDbPool();
      const [result] = await pool.query(sql);

      if (result && result.length > 0) {
        const user = result[0];
        issueSessionCookie(res, user.username);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          username: user.username,
          role: user.role,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
      }
    } else {
      // Fallback to hardcoded credentials if MySQL is not available
      const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'admin123',
      };

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        issueSessionCookie(res, username);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          username: username,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password',
        });
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

