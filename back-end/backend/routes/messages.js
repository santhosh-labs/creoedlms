const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer storage for chat images ──────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `chat_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
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
            SELECT m.*, u.Name as SenderName 
            FROM Messages m
            JOIN Users u ON m.SenderID = u.ID
            WHERE (m.SenderID = ? AND m.ReceiverID = ?)
               OR (m.SenderID = ? AND m.ReceiverID = ?)
            ORDER BY m.SentAt ASC
        `, [req.user.id, req.params.userId, req.params.userId, req.user.id]);

        // Mark as read
        await pool.query(`UPDATE Messages SET IsRead = TRUE WHERE SenderID = ? AND ReceiverID = ?`, 
            [req.params.userId, req.user.id]);

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
// @desc    Send an image in chat
// @access  Private
router.post('/:receiverId/image', verifyToken, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const imageUrl = `/uploads/chat/${req.file.filename}`;
    const caption = req.body.caption || '';

    try {
        const [result] = await pool.query(
            `INSERT INTO Messages (SenderID, ReceiverID, Message, ImageUrl) VALUES (?, ?, ?, ?)`,
            [req.user.id, req.params.receiverId, caption, imageUrl]
        );
        res.json({ success: true, id: result.insertId, imageUrl });
    } catch (err) {
        console.error(err);
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
