import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import db from '../config/db.js'; // Adjust path if necessary

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for the token in the Authorization header (e.g., "Bearer eyJhbGci...")
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using your JWT_SECRET from the .env file
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database using the id from the token payload
      // We attach the user info to the request object (`req.user`) so our controllers can use it
      db.query('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [decoded.id], (err, results) => {
        if (err || results.length === 0) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }

        // Attach user data to the request
        req.user = results[0]; 
        next(); // Move on to the next piece of middleware or the controller
      });

    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

export { protect };