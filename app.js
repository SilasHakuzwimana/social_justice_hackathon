const express = require('express');
const dotenv = require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//get all static files
app.use(express.static('public'));
app.get('/index',(req,res) => {
  res.sendFile(__dirname + '/public/index.html');
})
app.get('/contact', (req, res) =>{
  res.sendFile(__dirname + '/public/contact.html');
})
app.get('/register', (req,res) =>{
  res.sendFile(__dirname + '/public/register.html');
})
app.get('/trainings', (req, res) =>{
  res.sendFile(__dirname + '/public/training.html');
})
app.get('/practices', (req, res) =>{
  res.sendFile(__dirname + '/public/practices.html');
})
app.get('/outreach', (req, res) =>{
  res.sendFile(__dirname + '/public/outreach.html');
})
app.get('/login',(req,res) => {
  res.sendFile(__dirname + '/public/login.html');
})
app.get('/forgot', (req,res) =>{
  res.sendFile(__dirname + '/public/forgot_password.html');
})
app.get('/reset-password', (req,res) =>{
  res.sendFile(__dirname + '/public/reset_password.html');
})
app.get('/verify-otp', (req,res) =>{
  res.sendFile(__dirname + '/public/verify_otp.html');
})

app.get('/officials',(req,res) =>{
  res.sendFile(__dirname + '/public/officials.html');
})
app.get('/citizens',(req,res) =>{
  res.sendFile(__dirname + '/public/citizens.html');
})
app.get('/about',(req,res) =>{
  res.sendFile(__dirname + '/public/about.html');
})

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD, // Ensure this is set in your .env file
  database: process.env.DBNAME
});

db.connect((err) => {

  if (err) throw err;
  console.log('MySQL connected!');
});

/// Register route
app.post('/register', [
  // Validate and sanitize inputs
  body('fullName').notEmpty().withMessage('Full Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('nationalId').isLength({ max: 16 }).withMessage('National ID or Passport ID must be at most 16 characters.').optional(),
  body('location').notEmpty().withMessage('Location is required.'),
  body('phone').isLength({ max: 15 }).withMessage('Phone Number must be at most 15 characters.').optional(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, nationalId, location, phone, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      db.query(sql, [email], (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0); // True if user exists
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const sql = `INSERT INTO users (full_name, email, national_id, location, phone, password_hash) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [fullName, email, nationalId, location, phone, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register user' });
      }
      return res.status(201).json({ message: 'User registered successfully!' });
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to generate OTP
function generateOTP() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let otp = '';
  const otpLength = 9;
  for (let i = 0; i < otpLength; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
}

// Function to generate OTP
function generateOTP() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let otp = '';
  const otpLength = 9;
  for (let i = 0; i < otpLength; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
}

// Function to send OTP email
function sendOTPEmail(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Use environment variable for email
      pass: process.env.EMAIL_PASS  // Use environment variable for password
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your One-Time Password (OTP) is: ${otp}

Please enter this code to complete your login process. This code is valid for a limited time, so make sure to use it promptly.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

//login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if the email exists in the database
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.promise().query(sql, [email]);

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result[0];

    // Check if password exists in the database
    if (!user.password_hash) {
      return res.status(500).json({ error: 'Password not found in the database' });
    }

    // Check if password matches the hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in the database
    const updateSql = 'UPDATE users SET otp = ? WHERE email = ?';
    await db.promise().query(updateSql, [otp, email]);

    // Send OTP email
    sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'Login successful! OTP sent to your email.' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for OTP verification
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    // Verify OTP
    const sql = 'SELECT * FROM users WHERE email = ? AND otp = ?';
    const [result] = await db.promise().query(sql, [email, otp]);

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const user = result[0];

    // Clear OTP after successful verification
    const clearOtpSql = 'UPDATE users SET otp = NULL WHERE email = ?';
    await db.promise().query(clearOtpSql, [email]);

    // Redirect based on user role
    if (user.role === 'citizen') {
      return res.status(200).json({ message: 'OTP verified, redirecting to citizen dashboard' });
    } else if (user.role === 'official') {
      return res.status(200).json({ message: 'OTP verified, redirecting to official dashboard' });
    } else {
      return res.status(400).json({ error: 'User role not recognized' });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if the email exists in the database
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.promise().query(sql, [email]);

    if (result.length === 0) {
      return res.status(400).json({ error: 'No account found with that email' });
    }

    const user = result[0];

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set token expiration time (e.g., 1 hour)
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1);

    // Store the token and expiration in the database
    const updateSql = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
    await db.promise().query(updateSql, [resetToken, tokenExpiration, email]);

    // Send the reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    sendResetPasswordEmail(email, resetUrl);

    return res.status(200).json({ message: 'Reset password instructions sent to your email.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to send reset password email
function sendResetPasswordEmail(toEmail, resetUrl) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Reset Your Password',
    text: `You requested a password reset. Please click the link below to reset your password:

${resetUrl}

If you did not request a password reset, please ignore this email. This link will expire in 1 hour.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

app.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }

  try {
    // Check if the token and email exist and are valid
    const sql = 'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()';
    const [result] = await db.promise().query(sql, [email, token]);

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = result[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token
    const updateSql = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?';
    await db.promise().query(updateSql, [hashedPassword, email]);

    return res.status(200).json({ message: 'Password has been reset successfully!' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server (make sure to include this in your main server file)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
