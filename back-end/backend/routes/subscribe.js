const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Auto-create table
const initTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS NewsletterSubscribers (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                FullName VARCHAR(255) NOT NULL,
                Email VARCHAR(255) NOT NULL UNIQUE,
                SubscribedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('NewsletterSubscribers table init error:', err.message);
    }
};
initTable();

// POST /api/subscribe — public
router.post('/', async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) return res.status(400).json({ message: 'Name and email are required.' });
    try {
        await pool.query(
            `INSERT INTO NewsletterSubscribers (FullName, Email) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE FullName = VALUES(FullName), SubscribedAt = CURRENT_TIMESTAMP`,
            [fullName.trim(), email.trim().toLowerCase()]
        );
        res.status(201).json({ message: 'You\'re subscribed! Thank you for joining Creoed.' });
    } catch (err) {
        console.error('Subscribe error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// GET /api/subscribe — Admin / Super Admin only
router.get('/', verifyToken, async (req, res) => {
    if (!['Super Admin', 'Admin'].includes(req.user.role))
        return res.status(403).json({ message: 'Access denied.' });
    try {
        const [rows] = await pool.query(
            `SELECT ID, FullName, Email, SubscribedAt FROM NewsletterSubscribers ORDER BY SubscribedAt DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Subscribers fetch error:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/subscribe/:id — Admin / Super Admin only
router.delete('/:id', verifyToken, async (req, res) => {
    if (!['Super Admin', 'Admin'].includes(req.user.role))
        return res.status(403).json({ message: 'Access denied.' });
    try {
        await pool.query(`DELETE FROM NewsletterSubscribers WHERE ID = ?`, [req.params.id]);
        res.json({ message: 'Subscriber removed.' });
    } catch (err) {
        console.error('Subscriber delete error:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
