// pages/api/search.js - VULNERABLE: Stores search terms without sanitization
import { query, isMySQLAvailable, queryJSON, getDbPool } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { q, scope } = req.query;
    
    // Debug: Log raw query parameters
    console.log('[DEBUG] Raw query params:', { q, scope, isMySQLAvailable: isMySQLAvailable() });
    
    if (!q || q.trim() === '') {
      return res.status(200).json([]);
    }

    const searchTerm = q.trim();
    
    // Debug: Log the search term being used
    console.log('[DEBUG] Search term after trim:', searchTerm);

    // Store search term in history (VULNERABLE: No sanitization)
    await storeSearchHistory(searchTerm);

    if (scope === 'users' && isMySQLAvailable()) {
      // Basic search feature for admin panel.
      // VULNERABLE: unsanitized string concatenation enables SQL injection.
      // An attacker can tamper with this query and extract the entire users table.
      const sql = `
        SELECT id, username, role, email, created_at
        FROM users
        WHERE username LIKE '%${searchTerm}%'
        ORDER BY created_at DESC
      `;

      console.warn('[!] Executing vulnerable admin search:', sql.trim());
      // Use pool.query() instead of query() to bypass prepared statements
      // This makes it vulnerable to SQL injection
      const pool = getDbPool();
      
      if (!pool) {
        console.error('[ERROR] Database pool is null!');
        return res.status(500).json({ message: 'Database connection failed' });
      }
      
      try {
        const [rows] = await pool.query(sql);
        console.log('[DEBUG] Query executed successfully, rows returned:', rows.length);

        return res.status(200).json({
          results: rows,
          count: rows.length,
        });
      } catch (sqlError) {
        console.error('[ERROR] SQL execution failed:', sqlError.message);
        console.error('[ERROR] SQL that failed:', sql.trim());
        return res.status(500).json({ 
          message: 'SQL execution error', 
          error: sqlError.message,
          sql: sql.trim() // Return SQL for debugging (remove in production!)
        });
      }
    }

    // Search products
    let products = [];
    
    if (isMySQLAvailable()) {
      try {
        const rows = await query(
          `SELECT id, name, price, gender_id, sale, sale_price, image 
           FROM products 
           WHERE name LIKE ? OR name LIKE ? OR name LIKE ?
           ORDER BY id DESC`,
          [`%${searchTerm}%`, `${searchTerm}%`, `%${searchTerm}`]
        );
        products = rows.map(row => ({
          id: row.id,
          name: row.name,
          price: Number(row.price),
          gender_id: row.gender_id,
          sale: Boolean(row.sale),
          sale_price: row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : null,
          image: row.image || '/2.png',
        }));
      } catch (dbError) {
        console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
        const allProducts = await queryJSON('SELECT', 'products');
        products = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    } else {
      const allProducts = await queryJSON('SELECT', 'products');
      products = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function storeSearchHistory(searchTerm) {
  // VULNERABLE: Store search term without any sanitization
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

      await query(
        'INSERT INTO search_history (search_term) VALUES (?)',
        [searchTerm]
      );
    } catch (dbError) {
      console.warn('MySQL search history storage failed:', dbError.message);
      // Fall through to JSON
    }
  }

  // JSON fallback
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(process.cwd(), 'data');
  const historyFile = path.join(dataDir, 'search_history.json');

  let history = [];
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }

  const newId = history.length > 0 ? Math.max(...history.map((h) => h.id)) + 1 : 1;
  history.push({
    id: newId,
    search_term: searchTerm, // VULNERABLE: No sanitization
    created_at: new Date().toISOString(),
  });

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
}

