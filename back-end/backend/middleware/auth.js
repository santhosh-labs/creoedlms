const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication' });
    }

    try {
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
