const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SdjnELA2TtsrD7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '9R8yO8S2VUxuLygTpJJFsbnm';

// Initialize Razorpay natively
let razorpay = null;
try {
    razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
    });
} catch (e) {
    console.error("Failed to initialize Razorpay:", e);
}

// @route   POST api/payments/create-order
// @desc    Calculate fee and create Razorpay order for an authenticated student
// @access  Private
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.id;

        if (!razorpay) {
            return res.status(500).json({ message: 'Payment gateway not configured on server (Missing Keys)' });
        }

        // Fetch course details
        const [courseRows] = await pool.query('SELECT ID, Name, TotalFee FROM Courses WHERE ID = ?', [courseId]);
        if (courseRows.length === 0) return res.status(404).json({ message: 'Course not found' });
        
        const course = courseRows[0];
        const amountInPaise = Math.round(parseFloat(course.TotalFee) * 100);

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}_${studentId}_${courseId}`
        };

        const order = await razorpay.orders.create(options);
        
        // Return order ID and user info to the frontend
        res.json({
            orderId: order.id,
            amount: amountInPaise,
            currency: "INR",
            courseName: course.Name,
            userEmail: req.user.email,
            key: RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Error creating Razorpay order:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// @route   POST api/payments/verify
// @desc    Verify payment signature, enroll student, and send welcome email
// @access  Private
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { form, courseId } = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = form;
        const studentId = req.user.id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
                                        .update(body.toString())
                                        .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment is verified successfully.
            
            // 1. Fetch user to send email
            const [userRows] = await pool.query('SELECT Name, Email FROM Users WHERE ID = ?', [studentId]);
            const user = userRows[0];

            // 2. Insert into FeeManagement
            const [courseRows] = await pool.query('SELECT ID, Name, TotalFee FROM Courses WHERE ID = ?', [courseId]);
            const course = courseRows[0];
            
            await pool.query(
                'INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, ?, ?)',
                [studentId, courseId, course.TotalFee, course.TotalFee, 'Completed']
            );

            // 3. Find the most recent Class of this Course to assign the student
            const [classRows] = await pool.query('SELECT ID FROM Classes WHERE CourseID = ? ORDER BY ID DESC LIMIT 1', [courseId]);
            if (classRows.length > 0) {
                // Ignore if already enrolled
                await pool.query(
                    'INSERT IGNORE INTO ClassStudents (ClassID, StudentID) VALUES (?, ?)',
                    [classRows[0].ID, studentId]
                );
            }

            // 4. Send Confirmation Email via Resend
            if (process.env.RESEND_API_KEY) {
                try {
                    await resend.emails.send({
                        from: 'Creoed <onboarding@resend.dev>',
                        to: user.Email,
                        subject: `You're enrolled! Welcome to ${course.Name}`,
                        html: `
                            <h2>Welcome to Creoed, ${user.Name}!</h2>
                            <p>Thank you for purchasing <strong>${course.Name}</strong>.</p>
                            <p>Your payment of ₹${course.TotalFee} was successful. You now have full access to the course materials.</p>
                            <div style="margin: 30px 0;">
                                <a href="https://academy.creoed.com" style="background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
                            </div>
                            <p>You can use your website login credentials to sign in to your learning dashboard anytime at <a href="https://academy.creoed.com">academy.creoed.com</a></p>
                            <p>Happy Learning!<br>The Creoed Team</p>
                        `
                    });
                } catch (mailErr) {
                    console.error("Failed to send welcome email:", mailErr);
                }
            }

            res.json({ success: true, message: 'Payment verified and course assigned.' });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed',
                debug: {
                    expected: expectedSignature,
                    received: razorpay_signature,
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    secretUsed: RAZORPAY_KEY_SECRET.substring(0, 4) + '...'
                }
            });
        }
    } catch (err) {
        console.error('Error verifying payment:', err);
        res.status(500).json({ message: 'Internal Server Error', error: err.message, stack: err.stack });
    }
});

module.exports = router;
