import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

// Simple reviews API for products.
// POTENTIALLY VULNERABLE (for lab demonstration):
//  - Comments are stored and later rendered as raw HTML (stored XSS scenario).

export default async function handler(req, res) {
  const { product_id } = req.query;

  try {
    if (req.method === 'GET') {
      // If no product_id, return all reviews (for admin)
      if (!product_id) {
        const allReviews = await getAllReviews();
        return res.status(200).json(allReviews);
      }

      if (isNaN(Number(product_id))) {
        return res.status(400).json({ message: 'product_id must be a number' });
      }

      const reviews = await getReviewsForProduct(Number(product_id));
      return res.status(200).json(reviews);
    }

    if (req.method === 'POST') {
      const { name, rating, comment } = req.body || {};
      if (!name || !comment) {
        return res.status(400).json({ message: 'name and comment are required' });
      }

      const safeRating = rating !== undefined ? Math.max(1, Math.min(5, Number(rating) || 5)) : 5;

      // NOTE: We intentionally do not sanitize or encode the comment here.
      // This allows HTML (including scripts) to be stored and later rendered.
      const review = {
        product_id: Number(product_id),
        name: String(name).slice(0, 80),
        rating: safeRating,
        comment: String(comment),
      };

      const created = await createReview(review);
      return res.status(201).json(created);
    }

    if (req.method === 'PUT') {
      const { review_id } = req.query;
      if (!review_id || isNaN(Number(review_id))) {
        return res.status(400).json({ message: 'review_id query parameter is required' });
      }

      const { name, rating, comment } = req.body || {};
      if (!name || !comment) {
        return res.status(400).json({ message: 'name and comment are required' });
      }

      const safeRating = rating !== undefined ? Math.max(1, Math.min(5, Number(rating) || 5)) : 5;

      const updated = await updateReview(Number(review_id), {
        name: String(name).slice(0, 80),
        rating: safeRating,
        comment: String(comment),
      });

      if (!updated) {
        return res.status(404).json({ message: 'Review not found' });
      }
      return res.status(200).json({ message: 'Review updated successfully' });
    }

    if (req.method === 'DELETE') {
      const { review_id } = req.query;
      if (!review_id || isNaN(Number(review_id))) {
        return res.status(400).json({ message: 'review_id query parameter is required' });
      }

      const deleted = await deleteReview(Number(review_id));
      if (!deleted) {
        return res.status(404).json({ message: 'Review not found' });
      }
      return res.status(200).json({ message: 'Review deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Reviews API error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAllReviews() {
  if (isMySQLAvailable()) {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          rating INT NOT NULL DEFAULT 5,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const rows = await query(
        'SELECT id, product_id, name, rating, comment, created_at FROM reviews ORDER BY created_at DESC'
      );

      return rows.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        name: row.name,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
      }));
    } catch (dbError) {
      console.warn('MySQL reviews query failed, using JSON fallback:', dbError.message);
      // Fall through to JSON.
    }
  }

  // JSON fallback
  const all = await queryJSON('SELECT', 'reviews');
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getReviewsForProduct(productId) {
  if (isMySQLAvailable()) {
    try {
      // Create table if it does not exist.
      await query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          rating INT NOT NULL DEFAULT 5,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const rows = await query(
        'SELECT id, product_id, name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
        [productId]
      );

      return rows.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        name: row.name,
        rating: row.rating,
        comment: row.comment, // stored as-is
        created_at: row.created_at,
      }));
    } catch (dbError) {
      console.warn('MySQL reviews query failed, using JSON fallback:', dbError.message);
      // Fall through to JSON.
    }
  }

  // JSON fallback storage.
  const all = await queryJSON('SELECT', 'reviews');
  return all
    .filter((r) => r.product_id === productId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function createReview(review) {
  if (isMySQLAvailable()) {
    try {
      // Ensure table exists before insert.
      await query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          rating INT NOT NULL DEFAULT 5,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const result = await query(
        'INSERT INTO reviews (product_id, name, rating, comment) VALUES (?, ?, ?, ?)',
        [review.product_id, review.name, review.rating, review.comment]
      );

      return {
        id: result.insertId,
        ...review,
        created_at: new Date().toISOString(),
      };
    } catch (dbError) {
      console.warn('MySQL reviews insert failed, using JSON fallback:', dbError.message);
      // Fall through to JSON.
    }
  }

  // JSON fallback.
  const result = await queryJSON('INSERT', 'reviews', {
    values: {
      ...review,
      created_at: new Date().toISOString(),
    },
  });

  return {
    id: result.insertId,
    ...review,
    created_at: new Date().toISOString(),
  };
}

async function deleteReview(reviewId) {
  if (isMySQLAvailable()) {
    try {
      const result = await query('DELETE FROM reviews WHERE id = ?', [reviewId]);
      return result.affectedRows > 0;
    } catch (dbError) {
      console.warn('MySQL review delete failed, using JSON fallback:', dbError.message);
      // Fall through to JSON
    }
  }

  // JSON fallback - use queryJSON DELETE operation
  const result = await queryJSON('DELETE', 'reviews', { id: reviewId });
  return result.affectedRows > 0;
}

async function updateReview(reviewId, updates) {
  if (isMySQLAvailable()) {
    try {
      const result = await query(
        'UPDATE reviews SET name = ?, rating = ?, comment = ? WHERE id = ?',
        [updates.name, updates.rating, updates.comment, reviewId]
      );
      return result.affectedRows > 0;
    } catch (dbError) {
      console.warn('MySQL review update failed, using JSON fallback:', dbError.message);
      // Fall through to JSON
    }
  }

  // JSON fallback
  const result = await queryJSON('UPDATE', 'reviews', {
    id: reviewId,
    values: updates,
  });
  return result.affectedRows > 0;
}


