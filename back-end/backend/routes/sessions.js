const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── GET sessions for the logged-in user ──────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params = [];
        if (req.user.role === 'Tutor') {
            query = `SELECT s.ID, s.Title, s.SessionDate, s.SessionTime, s.MeetingLink, s.CreatedAt,
                            c.BatchName, co.Name as CourseName
                     FROM Sessions s
                     JOIN Classes c ON s.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     WHERE c.TutorID = ?
                     ORDER BY s.SessionDate DESC, s.SessionTime DESC`;
            params = [req.user.id];
        } else if (req.user.role === 'Student') {
            query = `SELECT s.ID, s.Title, s.SessionDate, s.SessionTime, s.MeetingLink, s.CreatedAt,
                            c.BatchName, co.Name as CourseName,
                            (SELECT COUNT(*) 
                               FROM Lessons l 
                               JOIN LessonProgress lp ON l.ID = lp.LessonID 
                               WHERE lp.StudentID = ? 
                                 AND l.Type = 'Live Class' 
                                 AND l.Title = s.Title 
                                 AND l.ModuleID IN (SELECT ID FROM Modules WHERE ClassID = s.ClassID)
                            ) as IsCompleted
                     FROM Sessions s
                     JOIN Classes c ON s.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     JOIN ClassStudents cs ON cs.ClassID = c.ID
                     WHERE cs.StudentID = ?
                     ORDER BY s.SessionDate DESC, s.SessionTime DESC`;
            params = [req.user.id, req.user.id];
        } else {
            query = `SELECT s.ID, s.Title, s.SessionDate, s.SessionTime, s.MeetingLink, s.CreatedAt,
                            c.BatchName, co.Name as CourseName
                     FROM Sessions s
                     JOIN Classes c ON s.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     ORDER BY s.SessionDate DESC, s.SessionTime DESC`;
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── POST create a session (Tutor / Admin / Super Admin) ───────────────────────
router.post('/', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { classId, title, sessionDate, sessionTime, meetingLink } = req.body;

    if (!classId || !title || !sessionDate || !sessionTime) {
        return res.status(400).json({ message: 'ClassID, Title, Date, and Time are required' });
    }

    try {
        // Tutors can only create sessions for their own classes
        if (req.user.role === 'Tutor') {
            const [check] = await pool.query('SELECT ID FROM Classes WHERE ID = ? AND TutorID = ?', [classId, req.user.id]);
            if (check.length === 0) return res.status(403).json({ message: 'Not authorised for this class' });
        }

        const [result] = await pool.query(
            'INSERT INTO Sessions (ClassID, Title, SessionDate, SessionTime, MeetingLink) VALUES (?, ?, ?, ?, ?)',
            [classId, title, sessionDate, sessionTime, meetingLink || null]
        );
        res.status(201).json({ id: result.insertId, message: 'Session created' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── DELETE a session ──────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM Sessions WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
