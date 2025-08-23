import db from '../config/db.js';

// 1. Create a new user (UPDATED FUNCTION)
export const createUser = (userData, callback) => {
  // The SQL query now includes all the new nullable columns for different roles.
  const sql = `
    INSERT INTO users (
      firstName, lastName, username, email, password, role, 
      studentId, semester, section, 
      teacherId, qualification, 
      adminId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // The order of values in this array MUST exactly match the order of columns and '?' marks in the SQL query.
  // We use '|| null' to ensure that if a field is missing from the form (undefined),
  // a proper NULL value is inserted into the database.
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

// 2. Find user by username (No changes needed)
export const findUserByUsername = (username, callback) => {
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], callback);
};

// 3. Find user by email (No changes needed)
export const findUserByEmail = (email, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], callback);
};