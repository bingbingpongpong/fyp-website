import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Support count-only query for cart badge
      if (req.query.count === 'true') {
        let totalQuantity = 0;
        if (isMySQLAvailable()) {
          try {
            // Create cart table if it doesn't exist
            await query(`
              CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                price DECIMAL(10,2) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);
            const rows = await query('SELECT SUM(quantity) as total FROM cart');
            totalQuantity = rows[0]?.total || 0;
          } catch (e) {
            // Table might not exist or query failed
            totalQuantity = 0;
          }
        } else {
          const cartItems = await queryJSON('SELECT', 'cart');
          totalQuantity = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        }
        return res.status(200).json({ count: Number(totalQuantity) });
      }

      let items = [];
      if (isMySQLAvailable()) {
        try {
          // Create cart table if it doesn't exist
          await query(`
            CREATE TABLE IF NOT EXISTS cart (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_id INT NOT NULL,
              quantity INT NOT NULL DEFAULT 1,
              price DECIMAL(10,2) NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
          `);
        } catch (e) {
          // Table creation failed, continue anyway
        }
        const rows = await query(
          `SELECT c.id,
                  c.product_id,
                  c.quantity,
                  p.name AS product_name,
                  p.price,
                  p.sale,
                  p.sale_price,
                  p.image
           FROM cart c
           LEFT JOIN products p ON p.id = c.product_id
           ORDER BY c.id DESC`
        );
        items = rows.map((row) => {
          // Use sale_price if available, otherwise use regular price
          const itemPrice = row.sale && row.sale_price !== null && row.sale_price !== undefined 
            ? Number(row.sale_price) 
            : Number(row.price || 0);
          return {
            id: row.id,
            product_id: row.product_id,
            quantity: row.quantity,
            product_name: row.product_name || 'Unknown',
            price: itemPrice,
            image: row.image || '/2.png',
            total: itemPrice * row.quantity,
          };
        });
      } else {
        const cartItems = await queryJSON('SELECT', 'cart', { orderBy: 'id DESC' });
        const products = await queryJSON('SELECT', 'products');
        items = cartItems.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          // Use stored price if available (for JSON), otherwise use sale_price or regular price
          const itemPrice = item.price !== undefined 
            ? Number(item.price) 
            : (product?.sale && product?.sale_price !== null && product?.sale_price !== undefined)
              ? Number(product.sale_price)
              : Number(product?.price || 0);
          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            product_name: product?.name || 'Unknown',
            price: itemPrice,
            image: product?.image || '/2.png',
            total: itemPrice * item.quantity,
          };
        });
      }
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const { product_id, quantity } = req.body;
      if (!product_id || !quantity) {
        return res.status(400).json({ message: 'product_id and quantity are required' });
      }
      
      // Get product to check sale status
      let product;
      if (isMySQLAvailable()) {
        try {
          const [prod] = await query('SELECT id, price, sale, sale_price FROM products WHERE id = ?', [Number(product_id)]);
          if (!prod) return res.status(404).json({ message: 'Product not found' });
          product = prod;
        } catch (dbError) {
          // Fall through to JSON
        }
      }
      if (!product) {
        const products = await queryJSON('SELECT', 'products', { where: { id: Number(product_id) } });
        if (!products.length) return res.status(404).json({ message: 'Product not found' });
        product = products[0];
      }

      if (isMySQLAvailable()) {
        try {
          // Create cart table if it doesn't exist
          await query(`
            CREATE TABLE IF NOT EXISTS cart (
              id INT AUTO_INCREMENT PRIMARY KEY,
              product_id INT NOT NULL,
              quantity INT NOT NULL DEFAULT 1,
              price DECIMAL(10,2) NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
          `);
          const [existing] = await query(
            'SELECT id, quantity FROM cart WHERE product_id = ?',
            [Number(product_id)]
          );
          if (existing) {
            await query(
              'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
              [Number(quantity), existing.id]
            );
            return res.status(200).json({ success: true, id: existing.id });
          }
          const result = await query(
            'INSERT INTO cart (product_id, quantity) VALUES (?, ?)',
            [Number(product_id), Number(quantity)]
          );
          return res.status(201).json({ success: true, id: result.insertId });
        } catch (dbError) {
          console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
          const cartItems = await queryJSON('SELECT', 'cart');
          const existing = cartItems.find((item) => item.product_id === Number(product_id));
          if (existing) {
            await queryJSON('UPDATE', 'cart', {
              id: existing.id,
              values: { quantity: existing.quantity + Number(quantity) },
            });
            return res.status(200).json({ success: true, id: existing.id });
          }
          const finalPrice = product.sale && product.sale_price !== null && product.sale_price !== undefined
            ? Number(product.sale_price)
            : Number(product.price);
          const result = await queryJSON('INSERT', 'cart', {
            values: { product_id: Number(product_id), quantity: Number(quantity), price: finalPrice },
          });
          return res.status(201).json({ success: true, id: result.insertId });
        }
      } else {
        const cartItems = await queryJSON('SELECT', 'cart');
        const existing = cartItems.find((item) => item.product_id === Number(product_id));
        if (existing) {
          await queryJSON('UPDATE', 'cart', {
            id: existing.id,
            values: { quantity: existing.quantity + Number(quantity) },
          });
          return res.status(200).json({ success: true, id: existing.id });
        }
        const finalPrice = product.sale ? Number(product.price) * 0.5 : Number(product.price);
        const result = await queryJSON('INSERT', 'cart', {
          values: { product_id: Number(product_id), quantity: Number(quantity), price: finalPrice },
        });
        return res.status(201).json({ success: true, id: result.insertId });
      }
    }

    if (req.method === 'PUT') {
      const { id, quantity } = req.body;
      if (!id || quantity === undefined) {
        return res.status(400).json({ message: 'id and quantity are required' });
      }
      if (isMySQLAvailable()) {
        const result = await query(
          'UPDATE cart SET quantity = ? WHERE id = ?',
          [Math.max(1, Number(quantity)), Number(id)]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }
        return res.status(200).json({ success: true });
      } else {
        const result = await queryJSON('UPDATE', 'cart', {
          id: Number(id),
          values: { quantity: Math.max(1, Number(quantity)) },
        });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'id query param is required' });
      if (isMySQLAvailable()) {
        const result = await query('DELETE FROM cart WHERE id = ?', [Number(id)]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }
        return res.status(200).json({ success: true });
      } else {
        const result = await queryJSON('DELETE', 'cart', { id: Number(id) });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e) {
    console.error('Cart API error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}


