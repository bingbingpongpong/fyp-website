// pages/api/reviews-cleanup.js
// Admin utility to clear all malicious reviews
import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

export default async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let deletedCount = 0;

    if (isMySQLAvailable()) {
      try {
        // Delete all reviews
        const result = await query('DELETE FROM reviews');
        deletedCount = result.affectedRows;
      } catch (dbError) {
        console.warn('MySQL cleanup failed, using JSON fallback:', dbError.message);
        // Fall through to JSON
      }
    }

    // JSON fallback - clear all reviews
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), 'data');
    const file = path.join(dataDir, 'reviews.json');

    if (fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf8');
      deletedCount = 'all';
    }

    return res.status(200).json({
      message: 'All reviews cleared successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Reviews cleanup error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

