const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication' });
    }

    try {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check against database to ensure account wasn't locked or deactivated recently
        const [rows] = await pool.query('SELECT IsLocked, IsActive FROM Users WHERE ID = ?', [decoded.id]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        if (rows[0].IsLocked) {
            return res.status(403).json({ message: 'Your account has been locked. Please contact support.' });
        }
        if (rows[0].IsActive === 0) {
            return res.status(403).json({ message: 'Your account is deactivated.' });
        }

        req.user = decoded; // Contains id, email, role
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
    return next();
};

// Role-based access control middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden. You do not have permissions to perform this action.' });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    authorizeRoles
};
