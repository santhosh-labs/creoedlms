const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { pool } = require('../config/db');

// @route   GET api/fees/my
// @desc    Get logged-in student's own fee record
// @access  Private (Student)
router.get('/my', verifyToken, async (req, res) => {
    try {
        const [[row]] = await pool.query(`
            SELECT fm.ID, fm.TotalFee as CourseFee, fm.AmountPaid as PaidAmount,
                   fm.PaymentStatus, fm.LastUpdated, c.Name as CourseName, c.TotalFee as CourseTotal
            FROM FeeManagement fm
            JOIN Courses c ON fm.CourseID = c.ID
            WHERE fm.StudentID = ?
            LIMIT 1
        `, [req.user.id]);
        if (!row) return res.status(404).json({ message: 'No fee record found' });
        res.json(row);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/fees
// @desc    Get all fees (includes StudentCode for display)
// @access  Private (Admin, Super Admin)
router.get('/', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT fm.ID, u.StudentCode, u.Name as StudentName, u.Phone,
                   c.Name as CourseName,
                   fm.TotalFee, fm.AmountPaid, fm.PaymentStatus, fm.LastUpdated
            FROM FeeManagement fm
            JOIN Users u ON fm.StudentID = u.ID
            JOIN Courses c ON fm.CourseID = c.ID
            ORDER BY fm.LastUpdated DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/fees/summary
// @desc    Get revenue summary for dashboard KPIs
// @access  Private (Admin, Super Admin)
router.get('/summary', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    try {
        const [[revenue]] = await pool.query(`SELECT COALESCE(SUM(AmountPaid), 0) as TotalCollected FROM FeeManagement`);
        const [[pending]] = await pool.query(`SELECT COALESCE(SUM(TotalFee - AmountPaid), 0) as TotalPending FROM FeeManagement`);
        const [[students]] = await pool.query(`SELECT COUNT(DISTINCT StudentID) as TotalStudents FROM FeeManagement`);
        res.json({
            totalCollected: revenue.TotalCollected,
            totalPending: pending.TotalPending,
            totalStudents: students.TotalStudents
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/fees/:id
// @desc    Update a student's fee payment — validates against TotalFee
// @access  Private (Admin, Super Admin)
router.put('/:id', verifyToken, authorizeRoles('Super Admin', 'Admin'), async (req, res) => {
    const { amountPaid } = req.body;
    const feeId = req.params.id;

    if (amountPaid === undefined || amountPaid === null) {
        return res.status(400).json({ message: 'amountPaid is required' });
    }

    try {
        const [[record]] = await pool.query('SELECT TotalFee FROM FeeManagement WHERE ID = ?', [feeId]);
        if (!record) return res.status(404).json({ message: 'Fee record not found' });

        const paid = parseFloat(amountPaid);
        const total = parseFloat(record.TotalFee);

        // Server-side guard: paid cannot exceed total
        if (paid < 0) return res.status(400).json({ message: 'Amount cannot be negative' });
        if (paid > total) return res.status(400).json({ message: `Amount paid (₹${paid}) cannot exceed total fee (₹${total})` });

        const status = paid >= total && total > 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';

        await pool.query(
            'UPDATE FeeManagement SET AmountPaid = ?, PaymentStatus = ?, LastUpdated = NOW() WHERE ID = ?',
            [paid, status, feeId]
        );

        res.json({ message: 'Fee updated successfully', paymentStatus: status });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
