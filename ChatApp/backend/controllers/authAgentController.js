const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = '8h';

exports.registerAgent = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const insertSQL = `INSERT INTO users (id, username, email, password, role)
                       VALUES (?, ?, ?, ?, 'agent')`;

    db.query(insertSQL, [id, name, email, hashedPassword], (err) => {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const token = jwt.sign({ userId: id, role: 'agent' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      res.status(201).json({ token, userId: id, role: 'agent' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.loginAgent = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const selectSQL = 'SELECT * FROM users WHERE email = ? AND role = "agent"';
  db.query(selectSQL, [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ userId: user.id, role: "agent" });
  });
};
