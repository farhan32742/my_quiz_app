import db from '../config/db.js';

// 1. Create a new user
export const createUser = (user, callback) => {
  const { firstName, lastName, username, email, password, role } = user;
  const sql = 'INSERT INTO users (firstName, lastName, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [firstName, lastName, username, email, password, role];
  db.query(sql, values, callback);
};

// 2. Find user by username
export const findUserByUsername = (username, callback) => {
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], callback);
};

// ✅ 3. ADD THIS FUNCTION: Find user by email (required by authController.js)
export const findUserByEmail = (email, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], callback);
};
