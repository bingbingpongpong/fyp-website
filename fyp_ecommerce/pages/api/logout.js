// pages/api/logout.js
// Logout endpoint that clears the adminSession cookie

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Clear the adminSession cookie by setting it to expire in the past
    const expires = new Date(0).toUTCString();
    res.setHeader(
      'Set-Cookie',
      `adminSession=; Path=/; Expires=${expires}; Max-Age=0`
    );

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}
