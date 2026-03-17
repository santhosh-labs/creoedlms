const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   POST api/progress/lesson/:lessonId
// @desc    Mark a lesson as completed (or unmark)
// @access  Private (Student)
router.post('/lesson/:lessonId', verifyToken, authorizeRoles('Student'), async (req, res) => {
    const { classId, isCompleted } = req.body;
    try {
        if (isCompleted) {
            await pool.query(
                `INSERT INTO LessonProgress (StudentID, ClassID, LessonID, IsCompleted) 
                 VALUES (?, ?, ?, TRUE) 
                 ON DUPLICATE KEY UPDATE IsCompleted = TRUE`,
                [req.user.id, classId, req.params.lessonId]
            );
        } else {
            await pool.query(
                `DELETE FROM LessonProgress WHERE StudentID = ? AND LessonID = ?`,
                [req.user.id, req.params.lessonId]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/progress/class/:classId
// @desc    Get progress stats for a class (for student view)
// @access  Private (Student)
router.get('/class/:classId', verifyToken, authorizeRoles('Student'), async (req, res) => {
    try {
        // Find manually completed lessons
        const [manualRows] = await pool.query(
            `SELECT LessonID FROM LessonProgress WHERE StudentID = ? AND ClassID = ?`,
            [req.user.id, req.params.classId]
        );
        
        // Find automatically completed past live classes
        const [autoRows] = await pool.query(
            `SELECT l.ID as LessonID FROM Lessons l 
             JOIN Modules m ON l.ModuleID = m.ID 
             WHERE m.ClassID = ? AND l.Type = 'Live Class' AND 
             EXISTS (SELECT 1 FROM Sessions s WHERE s.ClassID = m.ClassID AND s.Title = l.Title AND s.SessionDate < CURRENT_DATE)`,
            [req.params.classId]
        );

        const manualIds = manualRows.map(r => r.LessonID);
        const autoIds = autoRows.map(r => r.LessonID);
        const completedIds = [...new Set([...manualIds, ...autoIds])];
        const [totalRows] = await pool.query(
            `SELECT COUNT(l.ID) as total FROM Lessons l 
             JOIN Modules m ON l.ModuleID = m.ID 
             WHERE m.ClassID = ?`,
            [req.params.classId]
        );

        const total = totalRows[0].total || 0;
        const count = completedIds.length;
        const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

        res.json({ completedIds, count, total, percentage });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
