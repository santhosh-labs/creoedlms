const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// ─── GET all quizzes (for tutor → their classes, or by module) ────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        let query, params = [];
        if (req.user.role === 'Tutor') {
            query = `
                SELECT q.ID, q.Title, q.Description, q.TotalMarks, q.CreatedAt,
                       m.Title as ModuleTitle, c.BatchName, co.Name as CourseName,
                       (SELECT COUNT(*) FROM QuizQuestions qq WHERE qq.QuizID = q.ID) as QuestionCount,
                       (SELECT COUNT(DISTINCT qa.StudentID) FROM QuizAttempts qa WHERE qa.QuizID = q.ID) as AttemptCount
                FROM Quizzes q
                JOIN Modules m ON q.ModuleID = m.ID
                JOIN Classes c ON m.ClassID = c.ID
                JOIN Courses co ON c.CourseID = co.ID
                WHERE c.TutorID = ?
                ORDER BY q.CreatedAt DESC`;
            params = [req.user.id];
        } else if (req.user.role === 'Student') {
            query = `
                SELECT q.ID, q.Title, q.Description, q.TotalMarks, q.CreatedAt,
                       m.Title as ModuleTitle, co.Name as CourseName,
                       (SELECT COUNT(*) FROM QuizQuestions qq WHERE qq.QuizID = q.ID) as QuestionCount,
                       att.ID as AttemptID, att.Score, att.AttemptedAt
                FROM Quizzes q
                JOIN Modules m ON q.ModuleID = m.ID
                JOIN Classes c ON m.ClassID = c.ID
                JOIN Courses co ON c.CourseID = co.ID
                JOIN ClassStudents cs ON cs.ClassID = c.ID
                LEFT JOIN QuizAttempts att ON att.QuizID = q.ID AND att.StudentID = ?
                WHERE cs.StudentID = ?
                ORDER BY q.CreatedAt DESC`;
            params = [req.user.id, req.user.id];
        } else {
            query = `SELECT q.*, m.Title as ModuleTitle FROM Quizzes q JOIN Modules m ON q.ModuleID = m.ID ORDER BY q.CreatedAt DESC`;
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// ─── POST create quiz with questions ──────────────────────────────────────────
router.post('/', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    const { moduleId, title, description, questions } = req.body;
    if (!moduleId || !title || !questions || !questions.length) {
        return res.status(400).json({ message: 'ModuleID, Title and at least one question are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const totalMarks = questions.reduce((s, q) => s + (parseInt(q.marks) || 1), 0);
        const [qRes] = await connection.query(
            'INSERT INTO Quizzes (ModuleID, Title, Description, TotalMarks) VALUES (?, ?, ?, ?)',
            [moduleId, title, description || null, totalMarks]
        );
        const quizId = qRes.insertId;

        for (const q of questions) {
            await connection.query(
                'INSERT INTO QuizQuestions (QuizID, Question, OptionA, OptionB, OptionC, OptionD, CorrectOption, Marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [quizId, q.question, q.optionA, q.optionB, q.optionC || null, q.optionD || null, q.correctOption, parseInt(q.marks) || 1]
            );
        }
        await connection.commit();
        res.status(201).json({ id: quizId, message: 'Quiz created', totalMarks });
    } catch (err) {
        await connection.rollback();
        console.error(err); res.status(500).send('Server Error');
    } finally { connection.release(); }
});

// ─── GET quiz questions (for taking quiz) ─────────────────────────────────────
router.get('/:id/questions', verifyToken, async (req, res) => {
    try {
        // For students, hide correct answers
        const isStudent = req.user.role === 'Student';
        const select = isStudent
            ? 'ID, Question, OptionA, OptionB, OptionC, OptionD, Marks'
            : 'ID, Question, OptionA, OptionB, OptionC, OptionD, CorrectOption, Marks';
        const [rows] = await pool.query(`SELECT ${select} FROM QuizQuestions WHERE QuizID = ? ORDER BY ID`, [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).send('Server Error'); }
});

// ─── POST submit quiz attempt (Student) ────────────────────────────────────────
router.post('/:id/attempt', verifyToken, authorizeRoles('Student'), async (req, res) => {
    const { answers } = req.body; // [{ questionId, selectedOption }]
    const quizId = req.params.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Get correct answers
        const [questions] = await connection.query('SELECT ID, CorrectOption, Marks FROM QuizQuestions WHERE QuizID = ?', [quizId]);
        const [quiz] = await connection.query('SELECT TotalMarks FROM Quizzes WHERE ID = ?', [quizId]);
        if (!quiz.length) return res.status(404).json({ message: 'Quiz not found' });

        let score = 0;
        const [attempt] = await connection.query(
            'INSERT INTO QuizAttempts (QuizID, StudentID, Score, TotalMarks) VALUES (?, ?, 0, ?)',
            [quizId, req.user.id, quiz[0].TotalMarks]
        );
        const attemptId = attempt.insertId;

        for (const q of questions) {
            const ans = (answers || []).find(a => a.questionId == q.ID);
            const selected = ans?.selectedOption || null;
            const isCorrect = selected === q.CorrectOption ? 1 : 0;
            if (isCorrect) score += q.Marks;
            await connection.query(
                'INSERT INTO QuizAnswers (AttemptID, QuestionID, SelectedOption, IsCorrect) VALUES (?, ?, ?, ?)',
                [attemptId, q.ID, selected, isCorrect]
            );
        }
        await connection.query('UPDATE QuizAttempts SET Score = ? WHERE ID = ?', [score, attemptId]);
        await connection.commit();
        res.json({ score, totalMarks: quiz[0].TotalMarks, attemptId });
    } catch (err) {
        await connection.rollback(); console.error(err); res.status(500).send('Server Error');
    } finally { connection.release(); }
});

// ─── DELETE quiz ───────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, authorizeRoles('Tutor', 'Admin', 'Super Admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM Quizzes WHERE ID = ?', [req.params.id]);
        res.json({ message: 'Quiz deleted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
