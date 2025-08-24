import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// IMPORTANT: Import the new findUserById function
import { createUser, findUserByUsername, findUserById } from '../models/userModel.js';

dotenv.config();
const saltRounds = 10;

// Your 'signup' function remains the same
export const signup = async (req, res) => {
    // ... your existing signup code ...
    const { 
        firstName, lastName, username, email, password, role,
        studentId, semester, section, teacherId, qualification, adminId
    } = req.body;
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        const userData = {
            firstName, lastName, username, email, password: hash, role,
            studentId, semester, section, teacherId, qualification, adminId
        };
        createUser(userData, (err) => {
            if (err) {
                console.error("Database error:", err);
                return res.redirect('/signup?error=Username or email already in use');
            }
            res.redirect('/login');
        });
    } catch (err) {
        console.error("Server error:", err);
        res.redirect('/signup?error=An unexpected error occurred');
    }
};

// Your 'signin' function remains the same
export const signin = async (req, res) => {
    // ... your existing signin code ...
    const { username, password, role } = req.body;
    findUserByUsername(username, async (err, results) => {
        if (err || results.length === 0) {
            return res.redirect('/login?error=Invalid credentials');
        }
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match || user.role !== role) {
            return res.redirect('/login?error=Invalid credentials');
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.cookie('token', token, { httpOnly: true });
        switch (user.role) {
            case 'Student': res.redirect('/studentDashboard'); break;
            case 'Teacher': res.redirect('/teacherDashboard'); break;
            case 'Administrator': res.redirect('/adminDashboard'); break;
            default: res.redirect('/login');
        }
    });
};


// ADD THIS ENTIRE NEW FUNCTION
// This function will handle requests to the /api/me endpoint
export const getCurrentUser = (req, res) => {
  // The user ID is attached to req.user by our 'protect' middleware
  const userId = req.user.id;

  findUserById(userId, (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    
    // Send back the user's details as a JSON response
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role
    });
  });
};