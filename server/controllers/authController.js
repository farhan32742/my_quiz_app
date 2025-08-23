import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createUser, findUserByUsername } from '../models/userModel.js';

dotenv.config();
const saltRounds = 10;

// Your existing signup function remains the same
export const signup = async (req, res) => {
  const { firstName, lastName, username, email, password, role } = req.body;
  try {
    // Hash the password for security
    const hash = await bcrypt.hash(password, saltRounds);

    // Attempt to create the user in the database
    createUser({ firstName, lastName, username, email, password: hash, role }, (err) => {
      // If the database returns an error (e.g., username or email already exists)
      if (err) {
        // Redirect back to the signup page with an error message in the URL
        // You could later add code to your signup.html to display this message
        return res.redirect('/signup?error=Username or email already in use');
      }
      
      // --- THIS IS THE KEY CHANGE ---
      // If user creation is successful, redirect to the login page.
      res.redirect('/login');
    });
  } catch (err) {
    // If a server error occurs (e.g., bcrypt fails), redirect with a generic error
    res.redirect('/signup?error=An unexpected error occurred');
  }
};
// Updated signin function
export const signin = async (req, res) => {
  // Destructure username, password, AND role from the request body
  const { username, password, role } = req.body;

  findUserByUsername(username, async (err, results) => {
    // If user not found, redirect with an error
    if (err || results.length === 0) {
      return res.redirect('/login?error=Invalid credentials');
    }

    const user = results[0];

    // Compare the submitted password with the hashed password from the database
    const match = await bcrypt.compare(password, user.password);

    // If passwords don't match OR the role from the form doesn't match the user's role in the DB
    if (!match || user.role !== role) {
      return res.redirect('/login?error=Invalid credentials');
    }

    // Passwords and role match, proceed with creating a session/token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save the token in an HTTP-only cookie for security
    res.cookie('token', token, { httpOnly: true });

    // Redirect based on the user's role
    switch (user.role) {
      case 'Student':
        res.redirect('/studentDashboard');
        break;
      case 'Teacher':
        res.redirect('/teacherDashboard');
        break;
      case 'Administrator':
        res.redirect('/adminDashboard');
        break;
      default:
        // As a fallback, redirect to a generic login page
        res.redirect('/login');
    }
  });
};