const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── Auto-cleanup: Remove duplicate Attendance rows on startup ──────────────────
// Keeps the row with the highest ID (most recent) per (SessionID, StudentID)
(async () => {
    try {
        const [result] = await pool.query(`
            DELETE a1 FROM Attendance a1
            INNER JOIN Attendance a2
              ON  a1.SessionID = a2.SessionID
              AND a1.StudentID = a2.StudentID
              AND a1.ID < a2.ID
        `);
        if (result.affectedRows > 0) {
            console.log(`[Attendance] Cleaned ${result.affectedRows} duplicate attendance row(s).`);
        }
    } catch (e) {
        console.warn('[Attendance] Could not auto-clean duplicates:', e.message);
    }
})();

// ─── POST /cleanup-duplicates — manual trigger (Admin only) ─────────────────
router.post('/cleanup-duplicates', verifyToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    try {
        const [result] = await pool.query(`
            DELETE a1 FROM Attendance a1
            INNER JOIN Attendance a2
              ON  a1.SessionID = a2.SessionID
              AND a1.StudentID = a2.StudentID
              AND a1.ID < a2.ID
        `);
        res.json({ message: `Cleaned ${result.affectedRows} duplicate row(s).` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



// ─── GET students + their attendance for a session ────────────────────────────
router.get('/session/:sessionId', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.ID as StudentID, u.Name, u.StudentCode,
                   MAX(a.ID)     as AttendanceID,
                   MAX(a.Status) as Status
            FROM ClassStudents cs
            JOIN Classes c ON cs.ClassID = c.ID
            JOIN Sessions s ON s.ClassID = c.ID AND s.ID = ?
            JOIN Users u ON cs.StudentID = u.ID
            LEFT JOIN Attendance a ON a.SessionID = s.ID AND a.StudentID = u.ID
            GROUP BY u.ID, u.Name, u.StudentCode
            ORDER BY u.Name ASC
        `, [req.params.sessionId]);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// ─── GET all sessions for a class (with attendance summary) ────────────────────
router.get('/class/:classId/sessions', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.ID, s.Title, s.SessionDate, s.SessionTime, s.MeetingLink, s.CreatedAt,
                   COUNT(DISTINCT cs.StudentID) as TotalStudents,
                   COUNT(DISTINCT CASE WHEN a.Status = 'Present' THEN a.StudentID END) as PresentCount
            FROM Sessions s
            JOIN Classes c ON s.ClassID = c.ID
            LEFT JOIN ClassStudents cs ON cs.ClassID = c.ID
            LEFT JOIN Attendance a ON a.SessionID = s.ID
            WHERE s.ClassID = ?
            GROUP BY s.ID, s.Title, s.SessionDate, s.SessionTime, s.MeetingLink, s.CreatedAt
            ORDER BY s.SessionDate ASC, s.SessionTime ASC
        `, [req.params.classId]);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// ─── POST mark / update attendance for a session ──────────────────────────────
router.post('/session/:sessionId', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: 'Records array required' });
    }
    const sessionId = req.params.sessionId;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Delete ALL existing attendance rows for this session first
        // This prevents duplicates regardless of whether a UNIQUE constraint exists
        await connection.query(
            `DELETE FROM Attendance WHERE SessionID = ?`,
            [sessionId]
        );

        // Re-insert one clean record per student
        for (const r of records) {
            await connection.query(
                `INSERT INTO Attendance (SessionID, StudentID, Status, RecordedAt)
                 VALUES (?, ?, ?, NOW())`,
                [sessionId, r.studentId, r.status]
            );
        }

        await connection.commit();
        res.json({ message: 'Attendance saved' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally { connection.release(); }
});


// ─── GET overall student self-analytics ──────────────────────────────────────
// NOTE: This MUST be defined before /student/:studentId/class/:classId
router.get('/student/my_analytics', verifyToken, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Average assignment grade
        const [assignments] = await pool.query(`
            SELECT s.Grade FROM Submissions s
            WHERE s.StudentID = ? AND s.Grade IS NOT NULL
        `, [studentId]);
        const sumG = assignments.reduce((sum, a) => sum + parseFloat(a.Grade), 0);
        const avgGrade = assignments.length > 0 ? Math.round(sumG / assignments.length) : null;

        // Average quiz score (as %)
        const [quizzes] = await pool.query(`
            SELECT qa.Score, q.TotalMarks FROM QuizAttempts qa
            JOIN Quizzes q ON qa.QuizID = q.ID
            WHERE qa.StudentID = ? AND qa.Score IS NOT NULL AND q.TotalMarks > 0
        `, [studentId]);
        const sumQ = quizzes.reduce((sum, q) => sum + (q.Score / q.TotalMarks) * 100, 0);
        const avgQuiz = quizzes.length > 0 ? Math.round(sumQ / quizzes.length) : null;

        // Total past sessions the student should have attended
        const [allSessions] = await pool.query(`
            SELECT s.ID FROM Sessions s
            JOIN ClassStudents cs ON s.ClassID = cs.ClassID
            WHERE cs.StudentID = ?
              AND (s.SessionDate < CURDATE() OR (s.SessionDate = CURDATE() AND s.SessionTime <= CURTIME()))
        `, [studentId]);
        const totS = allSessions.length;

        // Sessions the student was marked Present for
        const [presentRows] = await pool.query(`
            SELECT COUNT(*) as cnt FROM Attendance a
            JOIN Sessions s ON a.SessionID = s.ID
            JOIN ClassStudents cs ON s.ClassID = cs.ClassID AND cs.StudentID = a.StudentID
            WHERE a.StudentID = ? AND a.Status = 'Present'
              AND (s.SessionDate < CURDATE() OR (s.SessionDate = CURDATE() AND s.SessionTime <= CURTIME()))
        `, [studentId]);
        const attendancePct = totS > 0 ? Math.round((presentRows[0].cnt / totS) * 100) : null;

        res.json({ avgGrade, avgQuiz, attendancePct });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// ─── GET student analytics for a specific class (Tutor/Admin view) ─────────────
router.get('/student/:studentId/class/:classId', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { studentId, classId } = req.params;
    try {
        const [assignments] = await pool.query(`
            SELECT a.Title, s.Grade, s.Feedback, s.SubmittedAt, a.DueDate
            FROM Assignments a
            JOIN Modules m ON a.ModuleID = m.ID
            LEFT JOIN Submissions s ON s.AssignmentID = a.ID AND s.StudentID = ?
            WHERE m.ClassID = ?
            ORDER BY a.DueDate ASC
        `, [studentId, classId]);

        const [quizzes] = await pool.query(`
            SELECT q.Title, q.TotalMarks, qa.Score, qa.AttemptedAt
            FROM Quizzes q
            JOIN Modules m ON q.ModuleID = m.ID
            LEFT JOIN QuizAttempts qa ON qa.QuizID = q.ID AND qa.StudentID = ?
            WHERE m.ClassID = ?
            ORDER BY q.CreatedAt ASC
        `, [studentId, classId]);

        const [attendance] = await pool.query(`
            SELECT s.Title, s.SessionDate,
                   MAX(CASE WHEN a.Status IS NOT NULL THEN a.Status END) as Status
            FROM Sessions s
            LEFT JOIN Attendance a ON a.SessionID = s.ID AND a.StudentID = ?
            WHERE s.ClassID = ?
            GROUP BY s.ID, s.Title, s.SessionDate
            ORDER BY s.SessionDate ASC, s.ID ASC
        `, [studentId, classId]);


        const totalSessions = attendance.length;
        const presentCount = attendance.filter(a => a.Status === 'Present').length;

        const [[progData]] = await pool.query(`
            SELECT 
                (SELECT COUNT(LessonID) FROM LessonProgress WHERE StudentID = ? AND ClassID = ?) as completed,
                (SELECT COUNT(l.ID) FROM Lessons l JOIN Modules m ON l.ModuleID = m.ID WHERE m.ClassID = ?) as total
        `, [studentId, classId, classId]);

        const progressPct = progData.total > 0 ? Math.round((progData.completed / progData.total) * 100) : 0;

        res.json({ assignments, quizzes, attendance, attendancePct: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null, progressPct });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

module.exports = router;
