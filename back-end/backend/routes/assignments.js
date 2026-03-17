const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── GET assignments (filtered by role) ───────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params = [];
        if (req.user.role === 'Tutor') {
            query = `SELECT a.ID, a.Title, a.Description, a.DueDate, a.AttachmentInstructions, a.CreatedAt,
                            m.Title as ModuleTitle, c.BatchName, co.Name as CourseName, m.ClassID,
                            COUNT(s.ID) as SubmissionCount
                     FROM Assignments a
                     JOIN Modules m ON a.ModuleID = m.ID
                     JOIN Classes c ON m.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     LEFT JOIN Submissions s ON s.AssignmentID = a.ID
                     WHERE c.TutorID = ?
                     GROUP BY a.ID, a.Title, a.Description, a.DueDate, a.AttachmentInstructions, a.CreatedAt, m.Title, c.BatchName, co.Name, m.ClassID 
                     ORDER BY a.DueDate ASC`;
            params = [req.user.id];
        } else if (req.user.role === 'Student') {
            query = `SELECT a.ID, a.Title, a.Description, a.DueDate, a.AttachmentInstructions,
                            m.Title as ModuleTitle, co.Name as CourseName,
                            s.ID as SubmissionID, s.FileUrl, s.Grade, s.Feedback, s.SubmittedAt, s.Status
                     FROM Assignments a
                     JOIN Modules m ON a.ModuleID = m.ID
                     JOIN Classes c ON m.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     JOIN ClassStudents cs ON cs.ClassID = c.ID
                     LEFT JOIN Submissions s ON s.AssignmentID = a.ID AND s.StudentID = ?
                     WHERE cs.StudentID = ?
                     ORDER BY a.DueDate ASC`;
            params = [req.user.id, req.user.id];
        } else {
            query = `SELECT a.ID, a.Title, a.Description, a.DueDate, a.CreatedAt,
                            m.Title as ModuleTitle, c.BatchName, co.Name as CourseName
                     FROM Assignments a
                     JOIN Modules m ON a.ModuleID = m.ID
                     JOIN Classes c ON m.ClassID = c.ID
                     JOIN Courses co ON c.CourseID = co.ID
                     ORDER BY a.DueDate ASC`;
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── POST create assignment (Tutor / Admin) ────────────────────────────────────
router.post('/', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { moduleId, title, description, dueDate, attachmentInstructions } = req.body;
    if (!moduleId || !title) return res.status(400).json({ message: 'ModuleID and Title are required' });
    try {
        const [result] = await pool.query(
            'INSERT INTO Assignments (ModuleID, Title, Description, DueDate, AttachmentInstructions) VALUES (?, ?, ?, ?, ?)',
            [moduleId, title, description || null, dueDate || null, attachmentInstructions || null]
        );
        res.status(201).json({ id: result.insertId, title, dueDate });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── DELETE assignment ─────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM Assignments WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── POST submit assignment (Student) ─────────────────────────────────────────
router.post('/:id/submit', verifyToken, authorizeRoles('Student'), async (req, res) => {
    const { fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ message: 'File URL required' });
    try {
        const [existing] = await pool.query('SELECT ID FROM Submissions WHERE AssignmentID = ? AND StudentID = ?', [req.params.id, req.user.id]);
        if (existing.length > 0) {
            await pool.query("UPDATE Submissions SET FileUrl = ?, Status = 'Submitted', SubmittedAt = CURRENT_TIMESTAMP WHERE ID = ?", [fileUrl, existing[0].ID]);
            res.status(200).json({ id: existing[0].ID });
        } else {
            const [result] = await pool.query(
                'INSERT INTO Submissions (AssignmentID, StudentID, FileUrl) VALUES (?, ?, ?)',
                [req.params.id, req.user.id, fileUrl]
            );
            res.status(201).json({ id: result.insertId });
        }
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── GET submissions for an assignment (Tutor) ────────────────────────────────
router.get('/:id/submissions', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.ID, s.FileUrl, s.Grade, s.Feedback, s.SubmittedAt, s.Status, u.Name as StudentName, u.StudentCode
             FROM Submissions s JOIN Users u ON s.StudentID = u.ID
             WHERE s.AssignmentID = ? ORDER BY s.SubmittedAt DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── PUT grade a submission (Tutor) ───────────────────────────────────────────
router.put('/submissions/:subId/grade', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { grade, feedback } = req.body;
    try {
        await pool.query('UPDATE Submissions SET Grade = ?, Feedback = ?, Status = ? WHERE ID = ?', [grade, feedback || null, 'Graded', req.params.subId]);
        res.json({ message: 'Graded' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── PUT mark for rework (Tutor) ──────────────────────────────────────────────
router.put('/submissions/:subId/rework', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { remark } = req.body;
    try {
        await pool.query("UPDATE Submissions SET Grade = NULL, Feedback = ?, Status = 'Rework' WHERE ID = ?", [remark || null, req.params.subId]);
        res.json({ message: 'Marked for rework' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
