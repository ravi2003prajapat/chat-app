const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// DB connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
  port: process.env.DB_PORT || 3306,
});

// Choose the role here: 'customer' or 'agent'
const role = 'customer';  // change to 'customer' or 'agent' as needed

// Set user details depending on role
const userData = {
  customer: {
    username: 'customer',
    email: 'customer@gmail.com',
    plainPassword: 'customer',
  },
  agent: {
    username: 'agent',
    email: 'agent@gmail.com',
    plainPassword: 'agent',
  }
}[role];

if (!userData) {
  console.error("Invalid role selected. Use 'customer' or 'agent'");
  process.exit(1);
}

// Hash and insert
bcrypt.hash(userData.plainPassword, 10, (err, hashedPassword) => {
  if (err) throw err;

  const query = 'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)';
  const id = uuidv4();

  connection.query(query, [id, userData.username, userData.email, hashedPassword, role], (err, result) => {
    if (err) throw err;

    console.log(`${role} user inserted into database.`);
    connection.end();
  });
});
