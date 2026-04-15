const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Ensure table exists on startup
const initTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ContactSubmissions (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                FullName VARCHAR(255) NOT NULL,
                ContactNumber VARCHAR(30),
                Email VARCHAR(255) NOT NULL,
                InterestedDomain VARCHAR(255),
                Message TEXT,
                Status ENUM('Not Contacted', 'Contacted') DEFAULT 'Not Contacted',
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Add Status column if it doesn't exist (for existing tables)
        await pool.query(`ALTER TABLE ContactSubmissions ADD COLUMN IF NOT EXISTS Status ENUM('Not Contacted','Contacted') DEFAULT 'Not Contacted'`).catch(() => {});
    } catch (err) {
        console.error('ContactSubmissions table init error:', err.message);
    }
};
initTable();

// @route   POST /api/contact
// @desc    Submit contact form (Public)
// @access  Public
router.post('/', async (req, res) => {
    const { fullName, contactNumber, email, interestedDomain, message } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ message: 'Full name and email are required.' });
    }

    try {
        await pool.query(
            `INSERT INTO ContactSubmissions (FullName, ContactNumber, Email, InterestedDomain, Message)
             VALUES (?, ?, ?, ?, ?)`,
            [fullName, contactNumber || null, email, interestedDomain || null, message || null]
        );
        res.status(201).json({ message: 'Your message has been received! We will get back to you within 24–48 hours.' });
    } catch (err) {
        console.error('Contact form submit error:', err.message);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// @route   GET /api/contact
// @desc    Get all contact submissions (Super Admin / Admin only)
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    if (!['Super Admin', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        const [rows] = await pool.query(
            `SELECT ID, FullName, ContactNumber, Email, InterestedDomain, Message, Status, CreatedAt
             FROM ContactSubmissions ORDER BY CreatedAt DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Contact fetch error:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// @route   PATCH /api/contact/:id/status
// @desc    Toggle contacted status (Super Admin / Admin only)
// @access  Private
router.patch('/:id/status', verifyToken, async (req, res) => {
    if (!['Super Admin', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    const { status } = req.body; // 'Contacted' or 'Not Contacted'
    if (!['Contacted', 'Not Contacted'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status.' });
    }
    try {
        await pool.query(`UPDATE ContactSubmissions SET Status = ? WHERE ID = ?`, [status, req.params.id]);
        res.json({ message: 'Status updated.', status });
    } catch (err) {
        console.error('Contact status update error:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// @route   DELETE /api/contact/:id
// @desc    Delete a contact submission (Super Admin / Admin only)
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
    if (!['Super Admin', 'Admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    try {
        await pool.query(`DELETE FROM ContactSubmissions WHERE ID = ?`, [req.params.id]);
        res.json({ message: 'Deleted successfully.' });
    } catch (err) {
        console.error('Contact delete error:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
