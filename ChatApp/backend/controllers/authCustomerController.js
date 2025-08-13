// controllers/authCustomerController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = '8h';

exports.registerCustomer = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  const selectSQL = 'SELECT * FROM users WHERE email = ?';
  db.query(selectSQL, [email], async (err, results) => {
    if (results.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);  // 👈 Make sure this is correct

    const insertSQL = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "customer")';
    db.query(insertSQL, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });

      res.status(201).json({ message: "Customer registered successfully" });
    });
  });
};


exports.loginCustomer = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const selectSQL = 'SELECT * FROM users WHERE email = ? AND role = "customer"';
  db.query(selectSQL, [email], async (err, results) => {
    if (err || results.length === 0) {
      console.log("❌ User not found or DB error:", err);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];

    // 🔍 Debugging password comparison
    console.log("🔑 Entered Password:", password);
    console.log("🔐 Hashed Password from DB:", user.password);

    const match = await bcrypt.compare(password, user.password);
    console.log("✅ Password Match?", match);

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ userId: user.id, role: "customer" });
  });
};
