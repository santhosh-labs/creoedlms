const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_33vnJG4v_7rRJbG6JJ698zrehX27Y3yn3';
let resend = null;
if (RESEND_API_KEY) {
    resend = new Resend(RESEND_API_KEY);
}

// @route   POST api/auth/login
// @desc    Authenticate user & get token — accepts email OR studentCode
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Allow login via Email OR StudentCode
        const [rows] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, u.Email, u.PasswordHash, u.RoleID, u.IsActive, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE u.Email = ? OR u.StudentCode = ?
        `, [email, email.toUpperCase()]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.IsActive === 0) {
            return res.status(403).json({ message: 'Please verify your email address to activate your account. Check your inbox.' });
        }

        const payload = {
            id: user.ID,
            email: user.Email,
            roleId: user.RoleID,
            role: user.RoleName
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 * 24 }, // 1 day
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.ID,
                        studentCode: user.StudentCode,
                        name: user.Name,
                        email: user.Email,
                        role: user.RoleName
                    }
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/resend-activation
// @desc    Resend the account activation email
// @access  Public
router.post('/resend-activation', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    try {
        const [rows] = await pool.query('SELECT ID, Name, IsActive, ActivationToken FROM Users WHERE Email = ?', [email]);
        if (rows.length === 0) return res.json({ message: 'If that email is registered, a new activation link has been sent.' });
        
        const user = rows[0];
        if (user.IsActive) return res.json({ message: 'Your account is already active. Please log in.' });
        
        // Generate new token
        const newToken = crypto.randomBytes(32).toString('hex');
        await pool.query('UPDATE Users SET ActivationToken = ? WHERE ID = ?', [newToken, user.ID]);
        
        const activationLink = `${process.env.LMS_API_URL || 'https://creoed-creoedlms.hf.space'}/api/auth/activate/${newToken}`;
        
        if (resend) {
            try {
                const result = await resend.emails.send({
                    from: 'Creoed <no-reply@creoed.com>',
                    to: email,
                    subject: 'Activate your Creoed account',
                    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto">
                        <h2 style="color:#7c3aed">Activate Your Account</h2>
                        <p>Hi ${user.Name},</p>
                        <p>Here is your new activation link. Click the button below to activate your Creoed account:</p>
                        <p style="text-align:center;margin:30px 0">
                            <a href="${activationLink}" style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                                Activate My Account
                            </a>
                        </p>
                        <p style="color:#64748b;font-size:0.9rem">Or copy this link: <br><a href="${activationLink}">${activationLink}</a></p>
                        <p>Happy Learning!<br><strong>The Creoed Team</strong></p>
                    </div>`
                });
                console.log('Resent activation email:', result);
            } catch (mailErr) {
                console.error('Failed to resend activation email:', JSON.stringify(mailErr));
                return res.status(500).json({ message: 'Email sending failed. Please contact support.' });
            }
        }
        
        res.json({ message: 'A new activation link has been sent to your email!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/public-register
// @desc    Public endpoint for student registration from the marketing website
// @access  Public
router.post('/public-register', async (req, res) => {
    const { name, email, phone, password, dob, gender, city, country, collegeName, courseId } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const connection = await pool.getConnection();
    try {
        const [userExists] = await connection.query('SELECT ID FROM Users WHERE Email = ?', [email]);
        if (userExists.length > 0) return res.status(400).json({ message: 'User already exists with this email' });

        // Get Student Role ID
        const [[role]] = await connection.query('SELECT ID, RoleName FROM Roles WHERE RoleName = "Student"');
        if (!role) return res.status(500).json({ message: 'Student role not configured in DB' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await connection.beginTransaction();

        const activationToken = crypto.randomBytes(32).toString('hex');

        const [insertResult] = await connection.query(
            `INSERT INTO Users (Name, Email, Phone, PasswordHash, RoleID, DateOfBirth, Gender, City, Country, CollegeName, IsActive, ActivationToken) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [name, email, phone || null, hashedPassword, role.ID, dob || null, gender || null, city || null, country || null, collegeName || null, activationToken]
        );
        const newUserId = insertResult.insertId;

        // Generate unique StudentCode CR + Year + 4 digits
        const year = new Date().getFullYear().toString().slice(-2);
        let userCode = `${year}0000`; // fallback
        let exists = true, attempts = 0;
        while (exists && attempts < 20) {
            const rand = Math.floor(1000 + Math.random() * 9000);
            userCode = `CR${year}${rand}`;
            const [rows] = await connection.query('SELECT ID FROM Users WHERE StudentCode = ?', [userCode]);
            exists = rows.length > 0;
            attempts++;
        }
        await connection.query('UPDATE Users SET StudentCode = ? WHERE ID = ?', [userCode, newUserId]);

        // If courseId provided, register intent to buy (Fee row: Pending)
        if (courseId) {
            const [[courseRow]] = await connection.query('SELECT TotalFee FROM Courses WHERE ID = ?', [courseId]);
            if (courseRow) {
                await connection.query(
                    'INSERT INTO FeeManagement (StudentID, CourseID, TotalFee, AmountPaid, PaymentStatus) VALUES (?, ?, ?, 0, "Pending")',
                    [newUserId, courseId, courseRow.TotalFee]
                );
            }
        }

        await connection.commit();

        // Send check your email activation
        if (resend) {
            // Determine host from environment, default to production website
            const activationLink = `${process.env.LMS_API_URL || 'https://creoed-creoedlms.hf.space'}/api/auth/activate/${activationToken}`;
            try {
                const emailResult = await resend.emails.send({
                    from: 'Creoed <no-reply@creoed.com>',
                    to: email,
                    subject: 'Activate your Creoed account',
                    html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
                        <h2 style="color:#7c3aed">Welcome to Creoed!</h2>
                        <p>Hi ${name},</p>
                        <p>Thank you for signing up! Please activate your account by clicking the button below:</p>
                        <p style="text-align:center;margin:30px 0">
                            <a href="${activationLink}" style="background:#7c3aed;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                                Activate My Account
                            </a>
                        </p>
                        <p style="color:#64748b;font-size:0.9rem">Or copy this link: <a href="${activationLink}">${activationLink}</a></p>
                        <p>Happy Learning!<br><strong>The Creoed Team</strong></p>
                    </div>`
                });
                console.log('Activation email sent:', emailResult);
            } catch (err) { console.error('Failed sending activation email:', JSON.stringify(err)); }
        }

        res.status(201).json({ message: 'Registration successful. Check your email to activate your account!', studentCode: userCode });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).send('Server Error');
    } finally {
        connection.release();
    }
});
// @desc    Get user data
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.ID, u.StudentCode, u.Name, u.Email, u.Phone, u.DateOfBirth, u.Gender, u.City, u.Country, u.CollegeName, r.RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.ID
            WHERE u.ID = ?
        `, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/activate/:token
// @desc    Activate account via email link
// @access  Public
router.get('/activate/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const [rows] = await pool.query('SELECT ID FROM Users WHERE ActivationToken = ? AND IsActive = 0', [token]);
        if (rows.length === 0) {
            return res.send('<h2>Invalid or expired link. Your account may already be activated.</h2><a href="https://creoed.com/login">Go to Login</a>');
        }
        
        await pool.query('UPDATE Users SET IsActive = 1, ActivationToken = NULL WHERE ID = ?', [rows[0].ID]);
        res.redirect('https://creoed.com/login?activated=true');
    } catch (err) {
        console.error('Activation Error:', err);
        res.status(500).send('Server Error during activation.');
    }
});

// Resend initialization is done above. No verify() needed like nodemailer.

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const [rows] = await pool.query(`SELECT ID, Name FROM Users WHERE Email = ?`, [email]);
        if (rows.length === 0) {
            // Return success even if not found to prevent email enumeration
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const user = rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Save token to DB, valid for 1 hour
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            `UPDATE Users SET ResetToken = ?, ResetTokenExpiry = ? WHERE ID = ?`,
            [resetToken, expiry, user.ID]
        );

        // Link to frontend reset page
        // Format: http://localhost:5173/reset-password/TOKEN
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const now = new Date();
        const expiryTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });

        const logoPath = path.resolve(__dirname, '../../../frontend/public/CREO.ED (9).png');
        const logoContent = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;

        const emailData = {
            from: 'Creoed <no-reply@creoed.com>',
            to: email,
            subject: 'Reset your Creoed LMS password',
            text: `Hello ${user.Name},\n\nA request has been received to change the password for your Creoed LMS account.\n\nReset your password here: ${resetLink}\n\nIf you did not initiate this request, please contact support@creoed.com.\n\nThank you,\nCreoed Team`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Password Reset</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Helvetica:wght@400;700&display=swap');
    body { font-family: 'Helvetica', Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 4px; overflow: hidden; }
    .header { padding: 30px 40px; text-align: left; }
    .content { padding: 0 40px 40px; color: #2c3338; }
    .greeting { font-size: 24px; color: #1a2e22; margin-bottom: 30px; }
    .body-text { font-size: 16px; line-height: 24px; color: #2c3338; margin-bottom: 30px; }
    .btn-container { text-align: center; margin-bottom: 40px; }
    .btn { display: inline-block; background-color: #338cf0; color: #ffffff !important; padding: 14px 40px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 4px; }
    .footer { padding: 40px; text-align: center; background-color: #ffffff; border-top: 1px solid #f4f7f9; }
    .footer-text { font-size: 12px; color: #7b8994; line-height: 18px; margin-bottom: 10px; }
    .footer-links { font-size: 12px; color: #338cf0; text-decoration: none; margin: 0 5px; }
    .footer-logo { margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="cid:logo" alt="Creoed LMS" width="160" style="display: block; border: 0;">
    </div>
    <div class="content">
      <div class="greeting">Hello ${user.Name},</div>
      <div class="body-text">
        <strong>A request has been received to change the password for your Creoed LMS account.</strong>
      </div>
      <div class="btn-container">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </div>
      <div class="body-text">
        If you did not initiate this request, please contact us immediately at <a href="mailto:support@creoed.com" style="color: #338cf0; text-decoration: none;">support@creoed.com</a>.
      </div>
      <div class="body-text" style="margin-bottom: 0;">
        Thank you,<br>
        The Creoed Team
      </div>
    </div>
  </div>
</body>
</html>
            `,
            attachments: logoContent ? [{
                filename: 'logo.png',
                content: logoContent,
                content_id: 'logo'
            }] : []
        };

        if (!RESEND_API_KEY) {
            console.error('Email not sent: RESEND_API_KEY not configured in .env');
            // Still return success but log the reset link in the terminal
            console.log('🔗 RESET LINK (copy this):', resetLink);
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        try {
            await resend.emails.send(emailData);
            console.log('✅ Reset email sent via Resend to:', email);
        } catch (mailErr) {
            console.error('❌ Resend email send error:', mailErr.message);
            // Log the link to terminal as fallback
            console.log('🔗 RESET LINK (copy this as fallback):', resetLink);
            return res.status(500).json({ message: 'Failed to send email. Please check Resend settings. Contact admin for help.' });
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ message: 'Missing fields' });

    try {
        const [rows] = await pool.query(`
            SELECT ID, ResetTokenExpiry FROM Users WHERE ResetToken = ?
        `, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = rows[0];
        if (new Date() > new Date(user.ResetTokenExpiry)) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query(`
            UPDATE Users SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE ID = ?
        `, [hash, user.ID]);

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
