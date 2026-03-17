const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── GET all tickets (filtered by role) ───────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params = [];
        if (req.user.role === 'Student') {
            // Student sees only their own tickets
            query = `SELECT t.ID, t.Subject, t.Description, t.Status, t.CreatedAt,
                            u.Name as TutorName, t.TutorID
                     FROM Tickets t
                     LEFT JOIN Users u ON t.TutorID = u.ID
                     WHERE t.StudentID = ? ORDER BY t.CreatedAt DESC`;
            params = [req.user.id];
        } else if (req.user.role === 'Tutor') {
            // Tutor sees tickets directed at them
            query = `SELECT t.ID, t.Subject, t.Description, t.Status, t.CreatedAt,
                            u.Name as StudentName, u.StudentCode
                     FROM Tickets t
                     JOIN Users u ON t.StudentID = u.ID
                     WHERE t.TutorID = ? ORDER BY t.CreatedAt DESC`;
            params = [req.user.id];
        } else {
            // Admin / Super Admin sees all
            query = `SELECT t.ID, t.Subject, t.Description, t.Status, t.CreatedAt,
                            s.Name as StudentName, s.StudentCode,
                            tt.Name as TutorName
                     FROM Tickets t
                     JOIN Users s ON t.StudentID = s.ID
                     LEFT JOIN Users tt ON t.TutorID = tt.ID
                     ORDER BY t.CreatedAt DESC`;
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── POST create ticket (Student) ─────────────────────────────────────────────
router.post('/', verifyToken, authorizeRoles('Student'), async (req, res) => {
    const { subject, description, tutorId } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'Subject and Description required' });
    if (!tutorId) return res.status(400).json({ message: 'Assigned Tutor is required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO Tickets (StudentID, TutorID, Subject, Description, Status) VALUES (?, ?, ?, ?, "Open")',
            [req.user.id, tutorId || null, subject, description]
        );
        res.status(201).json({ id: result.insertId, message: 'Ticket created' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── GET replies for a ticket ──────────────────────────────────────────────────
router.get('/:id/replies', verifyToken, async (req, res) => {
    try {
        const [replies] = await pool.query(
            `SELECT r.ID, r.Message, r.CreatedAt, u.Name as AuthorName, u.ID as AuthorID
             FROM TicketReplies r
             JOIN Users u ON r.UserID = u.ID
             WHERE r.TicketID = ? ORDER BY r.CreatedAt ASC`,
            [req.params.id]
        );
        res.json(replies);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── POST reply to ticket ──────────────────────────────────────────────────────
router.post('/:id/replies', verifyToken, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    try {
        await pool.query(
            'INSERT INTO TicketReplies (TicketID, UserID, Message) VALUES (?, ?, ?)',
            [req.params.id, req.user.id, message]
        );
        // Auto-set to In Progress when tutor replies
        if (req.user.role === 'Tutor') {
            await pool.query('UPDATE Tickets SET Status = "In Progress" WHERE ID = ? AND Status = "Open"', [req.params.id]);
        }
        res.status(201).json({ message: 'Reply posted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── PUT update ticket status ──────────────────────────────────────────────────
router.put('/:id/status', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { status } = req.body;
    const valid = ['Open', 'In Progress', 'Closed'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    try {
        await pool.query('UPDATE Tickets SET Status = ? WHERE ID = ?', [status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
