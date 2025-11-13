// pages/api/search-history.js - Returns search history (VULNERABLE: No sanitization)
import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let history = [];

    if (isMySQLAvailable()) {
      try {
        // Create search_history table if it doesn't exist
        await query(`
          CREATE TABLE IF NOT EXISTS search_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            search_term TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        const rows = await query(
          'SELECT id, search_term, created_at FROM search_history ORDER BY created_at DESC LIMIT 100'
        );
        history = rows.map(row => ({
          id: row.id,
          search_term: row.search_term, // VULNERABLE: No sanitization
          created_at: row.created_at,
        }));
      } catch (dbError) {
        console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
        // Fall through to JSON
      }
    }

    // JSON fallback
    if (history.length === 0) {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const historyFile = path.join(dataDir, 'search_history.json');

      if (fs.existsSync(historyFile)) {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        // Sort by created_at descending and limit to 100
        history = history
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 100);
      }
    }

    return res.status(200).json(history);
  } catch (error) {
    console.error('Search history API error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

