const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   POST api/modules
// @desc    Create a new module for a class
// @access  Private (Tutor)
router.post('/', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { classId, title, description } = req.body;

    if (!classId || !title) return res.status(400).json({ message: 'Class ID and Title required' });

    try {
        // Tutor check - must teach this class
        if (req.user.role === 'Tutor') {
            const [classCheck] = await pool.query('SELECT ID FROM Classes WHERE ID = ? AND TutorID = ?', [classId, req.user.id]);

            if (classCheck.length === 0) {
                return res.status(403).json({ message: 'Not authorized for this class' });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO Modules (ClassID, Title, Description) VALUES (?, ?, ?)',
            [classId, title, description || null]
        );

        res.status(201).json({ id: result.insertId, classId, title, description });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/modules/:classId
// @desc    Get all modules and lessons for a class
// @access  Private
router.get('/:classId', verifyToken, async (req, res) => {
    try {
        const classId = req.params.classId;

        // Authorization check
        if (req.user.role === 'Student') {
            const [enrollCheck] = await pool.query('SELECT ClassID FROM ClassStudents WHERE ClassID = ? AND StudentID = ?', [classId, req.user.id]);
            if (enrollCheck.length === 0) return res.status(403).json({ message: 'Not enrolled in this class' });
        } else if (req.user.role === 'Tutor') {
            const [tutorCheck] = await pool.query('SELECT ID FROM Classes WHERE ID = ? AND TutorID = ?', [classId, req.user.id]);
            if (tutorCheck.length === 0) return res.status(403).json({ message: 'Not tutor of this class' });
        }

        // Get Modules
        const [modules] = await pool.query('SELECT ID, Title, Description FROM Modules WHERE ClassID = ?', [classId]);

        // Get all lessons for these modules
        const [lessons] = await pool.query(`
            SELECT l.ID, l.ModuleID, l.Title, l.Type, l.ContentUrl,
                   (SELECT s.SessionDate FROM Sessions s 
                    WHERE s.ClassID = m.ClassID AND s.Title = l.Title 
                    ORDER BY s.CreatedAt DESC LIMIT 1) as SessionDate
            FROM Lessons l 
            JOIN Modules m ON l.ModuleID = m.ID 
            WHERE m.ClassID = ?
        `, [classId]);

        // Combine them
        const result = modules.map(mod => {
            return {
                ...mod,
                lessons: lessons.filter(l => l.ModuleID === mod.ID)
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/modules/:moduleId/lessons
// @desc    Add a lesson to a module
// @access  Private (Tutor)
router.post('/:moduleId/lessons', verifyToken, authorizeRoles('Tutor', 'Admin'), async (req, res) => {
    const { title, type, contentUrl } = req.body;
    const moduleId = req.params.moduleId;

    if (!title || !type || !contentUrl) return res.status(400).json({ message: 'Required fields missing' });

    try {
        const [result] = await pool.query(
            'INSERT INTO Lessons (ModuleID, Title, Type, ContentUrl) VALUES (?, ?, ?, ?)',
            [moduleId, title, type, contentUrl]
        );

        res.status(201).json({ id: result.insertId, title, type, contentUrl, moduleId });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/modules/:id
// @desc    Edit a module
// @access  Private (Tutor)
router.put('/:id', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    try {
        await pool.query('UPDATE Modules SET Title = ?, Description = ? WHERE ID = ?', [title, description || null, req.params.id]);
        res.json({ message: 'Module updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/modules/lessons/:lessonId
// @desc    Edit a lesson
// @access  Private (Tutor)
router.put('/lessons/:lessonId', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { title, type, contentUrl, classId, sessionDate, sessionTime, meetingLink } = req.body;
    if (!title || !type || !contentUrl) return res.status(400).json({ message: 'Required fields missing' });

    try {
        // Update the lesson itself
        await pool.query('UPDATE Lessons SET Title = ?, Type = ?, ContentUrl = ? WHERE ID = ?', [title, type, contentUrl, req.params.lessonId]);

        // If it's a Live Class and session date/time provided, update the corresponding Session row
        if (type === 'Live Class' && classId && sessionDate) {
            const sessionDatetime = sessionTime ? `${sessionDate} ${sessionTime}:00` : `${sessionDate} 00:00:00`;
            // Try to update an existing session that matches by title in the same class
            const [updateResult] = await pool.query(
                `UPDATE Sessions SET SessionDate = ?, MeetingLink = ? 
                 WHERE ClassID = ? AND Title = ? ORDER BY CreatedAt DESC LIMIT 1`,
                [sessionDatetime, meetingLink || null, classId, title]
            );
            // If no existing session was found, create one
            if (updateResult.affectedRows === 0 && sessionDate) {
                await pool.query(
                    'INSERT INTO Sessions (ClassID, Title, SessionDate, MeetingLink) VALUES (?, ?, ?, ?)',
                    [classId, title, sessionDatetime, meetingLink || null]
                );
            }
        }

        res.json({ message: 'Lesson updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/modules/:id
// @desc    Delete a module
// @access  Private (Tutor)
router.delete('/:id', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM LessonProgress WHERE LessonID IN (SELECT ID FROM Lessons WHERE ModuleID = ?)', [req.params.id]);
        await pool.query('DELETE FROM Lessons WHERE ModuleID = ?', [req.params.id]);
        await pool.query('DELETE FROM Modules WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Module deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/modules/lessons/:lessonId
// @desc    Delete a lesson
// @access  Private (Tutor)
router.delete('/lessons/:lessonId', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM LessonProgress WHERE LessonID = ?', [req.params.lessonId]);
        await pool.query('DELETE FROM Lessons WHERE ID = ?', [req.params.lessonId]);
        res.json({ message: 'Lesson deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
