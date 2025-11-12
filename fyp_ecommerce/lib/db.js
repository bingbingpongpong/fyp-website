import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool;
let useMySQL = false;

export function isMySQLAvailable() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  return !!(DB_HOST && DB_USER && DB_NAME);
}

export function getDbPool() {
  if (!isMySQLAvailable()) {
    return null;
  }
  if (!pool) {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    useMySQL = true;
  }
  return pool;
}

export async function query(sql, params = []) {
  if (!isMySQLAvailable()) {
    throw new Error('USE_JSON_FALLBACK');
  }
  const pool = getDbPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// JSON file fallback functions
const dataDir = path.join(process.cwd(), 'data');

function readJSON(file) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    return file === 'products.json' ? [] : [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(file, data) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function queryJSON(operation, table, data = {}) {
  const file = `${table}.json`;
  let items = readJSON(file);

  if (operation === 'SELECT') {
    let results = items;
    if (data.where) {
      results = items.filter((item) => {
        return Object.keys(data.where).every((key) => {
          const val = data.where[key];
          if (Array.isArray(val)) {
            return val.includes(item[key]);
          }
          return item[key] === val;
        });
      });
    }
    if (data.orderBy) {
      const [field, dir] = data.orderBy.split(' ');
      results.sort((a, b) => {
        if (dir === 'DESC') return b[field] - a[field];
        return a[field] - b[field];
      });
    }
    return results;
  }

  if (operation === 'INSERT') {
    const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const newItem = { id: newId, ...data.values };
    items.push(newItem);
    writeJSON(file, items);
    return { insertId: newId };
  }

  if (operation === 'UPDATE') {
    const index = items.findIndex((item) => item.id === data.id);
    if (index === -1) return { affectedRows: 0 };
    items[index] = { ...items[index], ...data.values };
    writeJSON(file, items);
    return { affectedRows: 1 };
  }

  if (operation === 'DELETE') {
    const index = items.findIndex((item) => item.id === data.id);
    if (index === -1) return { affectedRows: 0 };
    items.splice(index, 1);
    writeJSON(file, items);
    return { affectedRows: 1 };
  }

  return [];
}


