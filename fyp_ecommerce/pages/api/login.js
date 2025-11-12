// pages/api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Hardcoded admin credentials (for demo purposes)
  // In production, you should:
  // 1. Store credentials in a database with hashed passwords
  // 2. Use bcrypt or similar for password hashing
  // 3. Implement proper session management with JWT or secure cookies
  
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123', // Change this to a secure password
  };

  // Check credentials
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // In production, you would:
    // 1. Generate a JWT token
    // 2. Set a secure HTTP-only cookie
    // 3. Store session in database
    
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

