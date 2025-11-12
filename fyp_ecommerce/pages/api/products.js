import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    gender_id: row.gender_id,
    sale: Boolean(row.sale),
    sale_price: row.sale_price !== null && row.sale_price !== undefined ? Number(row.sale_price) : null,
    image: row.image || '/2.png',
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { gender, sale } = req.query;
      let rows;
      if (isMySQLAvailable()) {
        try {
          const conditions = [];
          const params = [];
          if (gender) {
            conditions.push('gender_id = ?');
            params.push(Number(gender));
          }
          if (sale !== undefined) {
            conditions.push('sale = ?');
            params.push(sale === 'true' ? 1 : 0);
          }
          const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
          rows = await query(
            `SELECT id, name, price, gender_id, sale, sale_price, image FROM products ${whereClause} ORDER BY id DESC`,
            params
          );
        } catch (dbError) {
          // MySQL connection failed, fall back to JSON
          console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
          const where = {};
          if (gender) where.gender_id = Number(gender);
          if (sale !== undefined) where.sale = sale === 'true' ? 1 : 0;
          rows = await queryJSON('SELECT', 'products', { where, orderBy: 'id DESC' });
          rows = rows.map(r => ({ ...r, sale_price: r.sale_price !== undefined ? Number(r.sale_price) : null }));
        }
      } else {
        const where = {};
        if (gender) where.gender_id = Number(gender);
        if (sale !== undefined) where.sale = sale === 'true' ? 1 : 0;
        rows = await queryJSON('SELECT', 'products', { where, orderBy: 'id DESC' });
        rows = rows.map(r => ({ ...r, sale_price: r.sale_price !== undefined ? Number(r.sale_price) : null }));
      }
      return res.status(200).json(rows.map(rowToProduct));
    }

    if (req.method === 'POST') {
      const { name, price, gender_id, sale, sale_price, image } = req.body;
      if (!name || price === undefined || !gender_id) {
        return res.status(400).json({ message: 'name, price, gender_id are required' });
      }
      let result, row;
      if (isMySQLAvailable()) {
        try {
          // Add sale_price column if it doesn't exist
          try {
            await query('ALTER TABLE products ADD COLUMN sale_price DECIMAL(10,2) NULL');
          } catch (e) {
            // Column already exists, ignore
          }
          result = await query(
            'INSERT INTO products (name, price, gender_id, sale, sale_price, image) VALUES (?, ?, ?, ?, ?, ?)',
            [name, Number(price), Number(gender_id), sale ? 1 : 0, sale_price ? Number(sale_price) : null, image || '/2.png']
          );
          [row] = await query(
            'SELECT id, name, price, gender_id, sale, sale_price, image FROM products WHERE id = ?',
            [result.insertId]
          );
        } catch (dbError) {
          // MySQL connection failed, fall back to JSON
          console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
          result = await queryJSON('INSERT', 'products', {
            values: {
              name,
              price: Number(price),
              gender_id: Number(gender_id),
              sale: sale ? 1 : 0,
              sale_price: sale_price ? Number(sale_price) : null,
              image: image || '/2.png',
            },
          });
          const rows = await queryJSON('SELECT', 'products', { where: { id: result.insertId } });
          row = rows[0];
        }
      } else {
        result = await queryJSON('INSERT', 'products', {
          values: {
            name,
            price: Number(price),
            gender_id: Number(gender_id),
            sale: sale ? 1 : 0,
            sale_price: sale_price ? Number(sale_price) : null,
            image: image || '/2.png',
          },
        });
        const rows = await queryJSON('SELECT', 'products', { where: { id: result.insertId } });
        row = rows[0];
      }
      return res.status(201).json(rowToProduct(row));
    }

    if (req.method === 'PUT') {
      const { id, name, price, gender_id, sale, image } = req.body;
      if (!id) return res.status(400).json({ message: 'id is required' });

      let result, row;
      if (isMySQLAvailable()) {
        try {
          const fields = [];
          const params = [];
          if (name !== undefined) {
            fields.push('name = ?');
            params.push(name);
          }
          if (price !== undefined) {
            fields.push('price = ?');
            params.push(Number(price));
          }
          if (gender_id !== undefined) {
            fields.push('gender_id = ?');
            params.push(Number(gender_id));
          }
          if (sale !== undefined) {
            fields.push('sale = ?');
            params.push(sale ? 1 : 0);
          }
          if (sale_price !== undefined) {
            // Add sale_price column if it doesn't exist
            try {
              await query('ALTER TABLE products ADD COLUMN sale_price DECIMAL(10,2) NULL');
            } catch (e) {
              // Column already exists, ignore
            }
            fields.push('sale_price = ?');
            params.push(sale_price ? Number(sale_price) : null);
          }
          if (image !== undefined) {
            fields.push('image = ?');
            params.push(image);
          }

          if (!fields.length) {
            return res.status(400).json({ message: 'No fields to update' });
          }

          params.push(Number(id));
          result = await query(
            `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
            params
          );
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
          }
          [row] = await query(
            'SELECT id, name, price, gender_id, sale, sale_price, image FROM products WHERE id = ?',
            [Number(id)]
          );
        } catch (dbError) {
          // MySQL connection failed, fall back to JSON
          console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
          const values = {};
          if (name !== undefined) values.name = name;
          if (price !== undefined) values.price = Number(price);
          if (gender_id !== undefined) values.gender_id = Number(gender_id);
          if (sale !== undefined) values.sale = sale ? 1 : 0;
          if (sale_price !== undefined) values.sale_price = sale_price ? Number(sale_price) : null;
          if (image !== undefined) values.image = image;
          if (Object.keys(values).length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
          }
          result = await queryJSON('UPDATE', 'products', { id: Number(id), values });
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
          }
          const rows = await queryJSON('SELECT', 'products', { where: { id: Number(id) } });
          row = rows[0];
        }
      } else {
        const values = {};
        if (name !== undefined) values.name = name;
        if (price !== undefined) values.price = Number(price);
        if (gender_id !== undefined) values.gender_id = Number(gender_id);
        if (sale !== undefined) values.sale = sale ? 1 : 0;
        if (image !== undefined) values.image = image;
        if (Object.keys(values).length === 0) {
          return res.status(400).json({ message: 'No fields to update' });
        }
        result = await queryJSON('UPDATE', 'products', { id: Number(id), values });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Product not found' });
        }
        const rows = await queryJSON('SELECT', 'products', { where: { id: Number(id) } });
        row = rows[0];
      }
      return res.status(200).json(rowToProduct(row));
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'id query param is required' });
      let row;
      if (isMySQLAvailable()) {
        try {
        [row] = await query(
          'SELECT id, name, price, gender_id, sale, sale_price, image FROM products WHERE id = ?',
          [Number(id)]
        );
        if (!row) return res.status(404).json({ message: 'Product not found' });
        await query('DELETE FROM products WHERE id = ?', [Number(id)]);
        } catch (dbError) {
          // MySQL connection failed, fall back to JSON
          console.warn('MySQL connection failed, using JSON fallback:', dbError.message);
          const rows = await queryJSON('SELECT', 'products', { where: { id: Number(id) } });
          if (!rows.length) return res.status(404).json({ message: 'Product not found' });
          row = rows[0];
          await queryJSON('DELETE', 'products', { id: Number(id) });
        }
      } else {
        const rows = await queryJSON('SELECT', 'products', { where: { id: Number(id) } });
        if (!rows.length) return res.status(404).json({ message: 'Product not found' });
        row = rows[0];
        await queryJSON('DELETE', 'products', { id: Number(id) });
      }
      return res.status(200).json(rowToProduct(row));
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e) {
    console.error('Products API error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}


