import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// This middleware function is designed to protect routes
export const protect = (req, res, next) => {
    // 1. Get the token from the httpOnly cookie
    const token = req.cookies.token;

    // 2. Check if the token exists
    if (token) {
        try {
            // 3. Verify the token is valid
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 4. Attach the decoded user payload (id, role) to the request object
            // This makes the user's info available in any subsequent route handlers
            req.user = decoded; 
            
            // 5. Proceed to the next step (the actual route controller)
            next(); 
        } catch (error) {
            console.error('Token verification failed:', error);
            // If verification fails, the user is not authorized
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
         // If there's no token at all, the user is not authorized
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};