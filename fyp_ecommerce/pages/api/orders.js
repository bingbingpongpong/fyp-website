// pages/api/orders.js
import { query, isMySQLAvailable, queryJSON } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { cartItems, totals, payment, shipping } = req.body;

    console.log('Orders API - Received data:', {
      cartItemsCount: cartItems?.length,
      totals,
      hasPayment: !!payment,
      hasShipping: !!shipping,
    });

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (!payment || !payment.cardNumber || !payment.expiryDate || !payment.cvv) {
      return res.status(400).json({ message: 'Payment information is required' });
    }

    if (!totals || totals.grand === undefined) {
      return res.status(400).json({ message: 'Totals are required' });
    }

    // Mask card number (only store last 4 digits)
    const maskedCard = payment.cardNumber.replace(/\s/g, '').slice(-4);

    const orderData = {
      items: JSON.stringify(cartItems),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.grand,
      card_last4: maskedCard,
      expiry_date: payment.expiryDate,
      cvv: payment.cvv.substring(payment.cvv.length - 1), // Only store last digit for security
      cardholder_name: payment.cardholderName,
      email: shipping.email,
      address: shipping.address,
      city: shipping.city,
      postal_code: shipping.postalCode,
      status: 'completed',
    };

    if (isMySQLAvailable()) {
      try {
        // Create orders table if it doesn't exist
        await query(`
          CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            items TEXT NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            shipping DECIMAL(10,2) NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            card_last4 VARCHAR(4) NOT NULL,
            expiry_date VARCHAR(5) NOT NULL,
            cvv VARCHAR(1) NOT NULL,
            cardholder_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            city VARCHAR(100) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            status VARCHAR(50) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        const result = await query(
          `INSERT INTO orders (items, subtotal, shipping, total, card_last4, expiry_date, cvv, cardholder_name, email, address, city, postal_code, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderData.items,
            orderData.subtotal,
            orderData.shipping,
            orderData.total,
            orderData.card_last4,
            orderData.expiry_date,
            orderData.cvv,
            orderData.cardholder_name,
            orderData.email,
            orderData.address,
            orderData.city,
            orderData.postal_code,
            orderData.status,
          ]
        );

        return res.status(201).json({
          success: true,
          orderId: result.insertId,
          message: 'Order placed successfully',
        });
      } catch (dbError) {
        console.error('MySQL orders error:', dbError);
        // Fall through to JSON fallback
      }
    }

    // JSON fallback
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), 'data');
    const ordersFile = path.join(dataDir, 'orders.json');

    let orders = [];
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
    }

    const newId = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
    const newOrder = {
      id: newId,
      ...orderData,
      created_at: new Date().toISOString(),
    };

    orders.push(newOrder);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');

    return res.status(201).json({
      success: true,
      orderId: newId,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Orders API error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

