// pages/api/change-password.js
// POTENTIALLY VULNERABLE (for lab demonstration):
//  - No CSRF protection (relies only on cookies)
//  - Any site can POST to this endpoint while the victim is logged in

import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

function getUsernameFromSessionCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith('adminSession='));
  if (!sessionCookie) return null;
  const value = sessionCookie.split('=')[1] || '';
  // Format: username:timestamp
  const parts = decodeURIComponent(value).split(':');
  return parts[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const username = getUsernameFromSessionCookie(req);

    // If there's no session cookie, treat as unauthenticated
    if (!username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    // Basic validation (but intentionally weak for demo)
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'newPassword and confirmPassword are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // POTENTIALLY VULNERABLE:
    //  - We do NOT verify currentPassword properly.
    //  - We rely only on the presence of the adminSession cookie.
    //  - No CSRF token, no origin/referrer checks.

    let updated = false;

    if (isMySQLAvailable()) {
      try {
        await query(
          'UPDATE users SET password = ? WHERE username = ?',
          [String(newPassword), String(username)]
        );
        updated = true;
      } catch (dbError) {
        console.warn('MySQL change-password failed, using JSON fallback:', dbError.message);
      }
    }

    if (!updated) {
      // JSON fallback: update users.json (for demo environments without DB)
      const users = await queryJSON('SELECT', 'users');
      const user = users.find((u) => u.username === username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await queryJSON('UPDATE', 'users', {
        id: user.id,
        values: { password: String(newPassword) },
      });
    }

    return res.status(200).json({
      message: 'Password changed successfully (demo — vulnerable to CSRF)',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}


