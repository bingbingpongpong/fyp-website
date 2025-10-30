// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Setup middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: "insecuresecret", resave: false, saveUninitialized: true }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Create database
const db = new sqlite3.Database("shop.db");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, description TEXT)");

  // Default data
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO users (username, password) VALUES ('alice', 'password123')");
      db.run("INSERT INTO products (name, price, description) VALUES ('Red Shoes', 59.9, 'Comfortable and stylish')");
    }
  });
});

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Routes
app.get("/", (req, res) => {
  db.all("SELECT * FROM products", (err, products) => {
    res.render("index", { user: req.session.username, products });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // 🚨 Vulnerable SQL injection example
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  db.get(query, (err, user) => {
    if (user) {
      req.session.username = user.username;
      res.redirect("/");
    } else {
      res.send("Invalid credentials");
    }
  });
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded: " + req.file.originalname);
});

app.get("/product/:id", (req, res) => {
  const id = req.params.id;
  // 🚨 Vulnerable SQL query
  db.get(`SELECT * FROM products WHERE id = ${id}`, (err, product) => {
    if (product) res.render("product", { product });
    else res.send("Product not found");
  });
});

app.listen(PORT, () => {
  console.log(`MiniShop running at http://127.0.0.1:${PORT}`);
});
