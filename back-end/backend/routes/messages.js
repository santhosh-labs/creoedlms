const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/db');
const multer = require('multer');

// ── Multer: memory storage (no disk writes) ──────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB raw limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ok = allowed.test(file.mimetype.replace('image/', ''));
        if (ok) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// @route   GET api/messages/contacts
// @desc    Get top tutors/students who exchange messages
// @access  Private
router.get('/contacts', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT u.ID, u.Name, u.StudentCode, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE u.ID IN (
                SELECT SenderID FROM Messages WHERE ReceiverID = ?
                UNION
                SELECT ReceiverID FROM Messages WHERE SenderID = ?
            )
        `, [req.user.id, req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/thread/:userId
// @desc    Get messages with a specific user
// @access  Private
router.get('/thread/:userId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.ID, m.SenderID, m.ReceiverID, m.Message, m.ImageUrl, m.IsRead, m.SentAt, u.Name as SenderName
            FROM Messages m
            JOIN Users u ON m.SenderID = u.ID
            WHERE (m.SenderID = ? AND m.ReceiverID = ?)
               OR (m.SenderID = ? AND m.ReceiverID = ?)
            ORDER BY m.SentAt ASC
        `, [req.user.id, req.params.userId, req.params.userId, req.user.id]);

        // Mark as read
        await pool.query(
            `UPDATE Messages SET IsRead = TRUE WHERE SenderID = ? AND ReceiverID = ?`,
            [req.params.userId, req.user.id]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages/:receiverId
// @desc    Send a text DM
// @access  Private
router.post('/:receiverId', verifyToken, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ msg: 'Message is required' });

    try {
        const [result] = await pool.query(
            `INSERT INTO Messages (SenderID, ReceiverID, Message) VALUES (?, ?, ?)`,
            [req.user.id, req.params.receiverId, message]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/messages/:receiverId/image
// @desc    Send an image — stored as base64 data URI in TiDB (no disk)
// @access  Private
router.post('/:receiverId/image', verifyToken, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    // Convert buffer → base64 data URI
    const mime = req.file.mimetype;
    const b64  = req.file.buffer.toString('base64');
    const dataUri = `data:${mime};base64,${b64}`;

    const caption = req.body.caption || '';

    try {
        const [result] = await pool.query(
            `INSERT INTO Messages (SenderID, ReceiverID, Message, ImageUrl) VALUES (?, ?, ?, ?)`,
            [req.user.id, req.params.receiverId, caption, dataUri]
        );
        res.json({ success: true, id: result.insertId, imageUrl: dataUri });
    } catch (err) {
        console.error('Image insert error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/messages/users
// @desc    Get list of available people to chat with
// @access  Private
router.get('/users', verifyToken, async (req, res) => {
    try {
        let query = '';
        let params = [req.user.id];

        if (req.user.role === 'Student') {
            query = `
                SELECT DISTINCT u.ID, u.Name, 'Tutor' as Type
                FROM Users u
                JOIN Classes c ON c.TutorID = u.ID
                JOIN ClassStudents cs ON cs.ClassID = c.ID
                WHERE cs.StudentID = ?
            `;
        } else if (req.user.role === 'Tutor') {
            query = `
                SELECT DISTINCT u.ID, u.Name, 'Student' as Type, u.StudentCode
                FROM Users u
                JOIN ClassStudents cs ON cs.StudentID = u.ID
                JOIN Classes c ON cs.ClassID = c.ID
                WHERE c.TutorID = ?
            `;
        } else {
            query = `
                SELECT u.ID, u.Name, r.RoleName as Type, u.StudentCode
                FROM Users u
                JOIN Roles r ON u.RoleID = r.ID
                WHERE u.ID != ?
            `;
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
