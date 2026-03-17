const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   GET api/announcements
// @desc    Get announcements relevant to the logged-in user's role
// @access  Private
router.get('/', verifyToken, async (req, res) => {
    try {
        const roleMap = {
            'Super Admin': 'Super Admin',
            'Admin':       'Admin',
            'Tutor':       'Tutor',
            'Student':     'Student',
        };
        const userRole = roleMap[req.user.role] || 'Student';

        // Super Admin sees all; others see their role-specific + "All"
        let query, params;
        if (userRole === 'Super Admin') {
            query = `
                SELECT a.ID, a.Title, a.Message, a.TargetType, a.ActionLabel, a.ActionLink, a.CreatedAt, u.Name as AuthorName
                FROM Announcements a
                JOIN Users u ON a.UserID = u.ID
                ORDER BY a.CreatedAt DESC
            `;
            params = [];
        } else {
            query = `
                SELECT a.ID, a.Title, a.Message, a.TargetType, a.ActionLabel, a.ActionLink, a.CreatedAt, u.Name as AuthorName
                FROM Announcements a
                JOIN Users u ON a.UserID = u.ID
                WHERE a.TargetType IN ('All', ?)
                ORDER BY a.CreatedAt DESC
            `;
            params = [userRole];
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/announcements
// @desc    Create a new announcement (Super Admin & Admin only)
// @access  Private
router.post('/', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { title, message, targetType, actionLabel, actionLink } = req.body;

    if (!title || !message || !targetType) {
        return res.status(400).json({ message: 'Title, Message and Target are required' });
    }

    const validTargets = ['All', 'Student', 'Tutor', 'Admin'];
    if (!validTargets.includes(targetType)) {
        return res.status(400).json({ message: 'Invalid target type. Must be: All, Student, Tutor, or Admin' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO Announcements (UserID, TargetType, Title, Message, ActionLabel, ActionLink)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                targetType,
                title.trim(),
                message.trim(),
                actionLabel ? actionLabel.trim() : null,
                actionLink  ? actionLink.trim()  : null,
            ]
        );
        res.status(201).json({ message: 'Announcement posted successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/announcements/:id
// @desc    Delete an announcement (Super Admin only)
// @access  Private
router.delete('/:id', verifyToken, authorizeRoles('Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM Announcements WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
