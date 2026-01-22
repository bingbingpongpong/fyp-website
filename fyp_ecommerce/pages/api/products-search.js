// pages/api/products-search.js - VULNERABLE: Union-Based SQL Injection
// This is intentionally vulnerable for educational/demonstration purposes
// DO NOT USE IN PRODUCTION

import { query, isMySQLAvailable, getDbPool } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ 
        success: false,
        error: 'Category parameter is required',
        results: []
      });
    }

    // ⚠️ VULNERABLE: Direct SQL string concatenation
    // This allows SQL injection attacks, including UNION SELECT
    // Example: category = "' UNION SELECT 1,2,3--"
    // For demo purposes only - NEVER do this in production!
    
    console.warn('[!] VULNERABLE: Searching products with category:', category);
    
    if (isMySQLAvailable()) {
      // ⚠️ VULNERABLE: SQL injection via string concatenation
      // Use pool.query() instead of query() to bypass prepared statements
      // Direct string concatenation allows UNION SELECT injection
      const sql = `SELECT id, name, price FROM products WHERE category = '${category}'`;
      
      console.warn('[!] VULNERABLE: Executing SQL:', sql);
      
      const pool = getDbPool();
      const [rows] = await pool.query(sql);
      
      return res.status(200).json({
        success: true,
        error: null,
        sql: sql, // Return SQL for debugging (remove in production!)
        results: rows,
        count: rows.length
      });
    } else {
      // JSON fallback - no SQL injection possible here
      const { queryJSON } = require('../../lib/db');
      const allProducts = await queryJSON('SELECT', 'products');
      const filtered = allProducts.filter(p => 
        (p.category && p.category.toLowerCase() === category.toLowerCase())
      );
      
      return res.status(200).json({
        success: true,
        error: null,
        results: filtered,
        count: filtered.length
      });
    }
  } catch (error) {
    console.error('[ERROR] Products search failed:', error.message);
    
    // Return error message
    return res.status(200).json({
      success: false,
      error: error.message,
      results: []
    });
  }
}
