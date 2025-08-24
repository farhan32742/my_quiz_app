import db from '../config/db.js';

// 1. Create a new user (Your existing code is fine)
export const createUser = (userData, callback) => {
  const sql = `
    INSERT INTO users (
      firstName, lastName, username, email, password, role, 
      studentId, semester, section, 
      teacherId, qualification, 
      adminId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    userData.firstName,
    userData.lastName,
    userData.username,
    userData.email,
    userData.password,
    userData.role,
    userData.studentId || null,
    userData.semester || null,
    userData.section || null,
    userData.teacherId || null,
    userData.qualification || null,
    userData.adminId || null
  ];
  db.query(sql, values, callback);
};

// 2. Find user by username (Your existing code is fine)
export const findUserByUsername = (username, callback) => {
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], callback);
};

// 3. Find user by email (Your existing code is fine)
export const findUserByEmail = (email, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], callback);
};


// 4. ADD THIS NEW FUNCTION
// This function finds a user by their ID and returns only the non-sensitive data
export const findUserById = (id, callback) => {
  const query = 'SELECT id, firstName, lastName, username, email, role FROM users WHERE id = ?';
  db.query(query, [id], (err, results) => {
    callback(err, results);
  });
};