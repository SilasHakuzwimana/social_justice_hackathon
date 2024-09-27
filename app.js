const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv')
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const router = express.Router();
const cors = require('cors');
const crypto = require('crypto');
const moment = require('moment-timezone');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const app = express();

// Set default timezone to EAT (East Africa Time)
moment.tz.setDefault("Africa/Kigali");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Use the user routes
app.use(session({
  secret: 'your_secret_key',  // Replace with a secure secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set `secure: true` in production with HTTPS
}));

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
app.get('/privacy-policy', (req,res) =>{
  res.sendFile(__dirname + '/public/privacy_policy.html');
})
app.get('/terms-conditions', (req,res) =>{
  res.sendFile(__dirname + '/public/terms_and_conditions.html');
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
app.get('/dashboard', (req,res) =>{
  res.sendFile(__dirname + '/public/dashboard.html');
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

/// Register-user route
app.post('/register-user', [
  // Validate and sanitize inputs
  body('fullName').notEmpty().withMessage('Full Name is required.'),
  body('new_user_email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('nationalId').isLength({ max: 16 }).withMessage('National ID or Passport ID must be at most 16 characters.').optional(),
  body('location').notEmpty().withMessage('Location is required.'),
  body('phone').isLength({ max: 15 }).withMessage('Phone Number must be at most 15 characters.').optional(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('new_user_role').notEmpty().withMessage('Please select a user role.')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, new_user_email, nationalId, location, phone, password, new_user_role } = req.body;

  try {
      // Check if the user already exists
      const existingUser = await new Promise((resolve, reject) => {
          const sql = `SELECT * FROM users WHERE email = ?`;
          db.query(sql, [new_user_email], (err, results) => {
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
      const sql = `INSERT INTO users (full_name, email, national_id, location, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.query(sql, [fullName, new_user_email, nationalId, location, phone, hashedPassword, new_user_role], (err, results) => {
          if (err) {
              console.error(err); // Log the error for debugging
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

// Function to send OTP email with user's name
function sendOTPEmail(toEmail, otp) {
  // Fetch user name from the database based on their email
  const query = 'SELECT full_name FROM users WHERE email = ?';
  
  db.query(query, [toEmail], (err, results) => {
    if (err) {
      console.error('Error fetching user data:', err);
      return;
    }

    // If user is found, use their full name, otherwise fallback to 'User'
    const userName = results.length > 0 ? results[0].full_name : 'User';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `${process.env.WEBSITE_NAME} <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Civic Accountability Platform Account OTP',
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Email</title>
          <style>
              body {
                  font-family: 'Arial', sans-serif;
                  background-color: #f4f4f4;
                  color: #333;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background-color: #0a58ca;
                  padding: 20px;
                  text-align: center;
                  color: #ffffff;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
              }
              .content {
                  padding: 20px;
                  line-height: 1.6;
              }
              .content p {
                  font-size: 16px;
                  margin-bottom: 20px;
              }
              .otp-code {
                  display: inline-block;
                  background-color: #f1f8ff;
                  padding: 10px 20px;
                  font-size: 24px;
                  font-weight: bold;
                  color: #0a58ca;
                  border-radius: 5px;
                  letter-spacing: 2px;
                  margin-bottom: 20px;
              }
              .cta {
                  text-align: center;
                  margin-top: 30px;
              }
              .cta a {
                  padding: 10px 20px;
                  background-color: #0a58ca;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 16px;
                  font-weight: bold;
              }
              .footer {
                  background-color: #f4f4f4;
                  padding: 15px;
                  text-align: center;
                  font-size: 12px;
                  color: #777;
              }
              .footer p {
                  margin: 5px 0;
                  text-align:center;
              }
              .footer a {
                  color: #0a58ca;
                  text-decoration: none;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>Your One-Time Password (OTP)</h1>
              </div>
              <div class="content">
                  <p>Hello, ${userName},</p>
                  <p>Your One-Time Password (OTP) to complete your login process is:</p>
                  <div class="otp-code">${otp}</div>
                  <p>Please enter this code promptly as it is valid for a limited time. If you did not request this code, please ignore this email.</p>
              </div>
              <div class="cta">
                  <a href="/verify-otp">Verify OTP Now</a>
              </div>
              <div class="footer">
                  <p>If you have any questions or need assistance, please <a href="#">contact our support team</a>.</p>
                  <p>Thank you for using our service!</p>
              </div>
              <footer>
            <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
             <p><a href="localhost:3000/privacy-policy" style="color: #999;">Privacy Policy</a>|<a href="localhost:3000/terms-conditions">Terms and Conditions</a></p>
          </footer>
          </div>
      </body>
      </html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });
}

app.post('/login', async (req, res) => {
  const loginTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');
  const messageTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');

  const { email, password } = req.body;

  if (!email || !password) {
    const message = 'Email and password are required';
    const status = `failure`; // Correct enum value

    // Log the failed login attempt (no user ID since email is missing)
    const logFailedSql = `
      INSERT INTO login_logs (email, status, login_time, message, message_time)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.promise().query(logFailedSql, [email, status, loginTime, message, messageTime]);

    return res.status(400).json({ error: message });
  }

  try {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.promise().query(sql, [email]);

    if (result.length === 0) {
      const message = 'Invalid email or password';
      const status = `failure`; // Correct enum value

      // Log the failed login attempt (user not found)
      const logFailedSql = `
        INSERT INTO login_logs (email, status, login_time, message, message_time)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.promise().query(logFailedSql, [email, status, loginTime, message, messageTime]);

      return res.status(400).json({ error: message });
    }

    const user = result[0];
    const userId = user.id;

    // Check if password matches the hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const message = 'Invalid email or password';
      const status = `failure`; // Correct enum value

      // Log the failed login attempt with user_id
      const logFailedSql = `
        INSERT INTO login_logs (user_id, email, status, login_time, message, message_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.promise().query(logFailedSql, [userId, email, status, loginTime, message, messageTime]);

      return res.status(400).json({ error: message });
    }

    // Login successful
    const otp = generateOTP();
    const otpExpirationTime = moment.tz("Africa/Kigali").add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const status = `success`; // Correct enum value

    // Update OTP and log success
    const updateSql = 'UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?';
    await db.promise().query(updateSql, [otp, otpExpirationTime, email]);

    const logSuccessSql = `
      INSERT INTO login_logs (user_id, email, status, otp, login_time, message, message_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const message = 'Login successful! OTP sent to your email.';
    const [logResult] = await db.promise().query(logSuccessSql, [userId, email, status, otp, loginTime, message, messageTime]);

    req.session.loggedEmail = email;
    req.session.userId = user.id;
    req.session.logId = logResult.insertId; // Store logId for logout tracking

    // Send OTP email
    sendOTPEmail(email, otp);

    return res.status(200).json({ message });

  } catch (error) {
    const message = 'Internal server error';
    const status = `failure`; // Correct enum value

    // Log the error in login logs
    const logErrorSql = `
      INSERT INTO login_logs (email, status, login_time, message, message_time)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.promise().query(logErrorSql, [email, status, loginTime, message, messageTime]);

    console.error('Login error:', error);
    return res.status(500).json({ error: message });
  }
});

// Route for OTP verification
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Check if both email and OTP are provided
  if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
      // Fetch user data based on email
      const sql = 'SELECT * FROM users WHERE email = ?';
      const [users] = await db.promise().query(sql, [email]);

      // Check if user exists
      if (users.length === 0) {
          return res.status(404).json({ error: 'User not found.' });
      }

      const userData = users[0];

    // Set session variables after successful login
    req.session.loggedEmail = users[0].email;
    req.session.userId = users[0].id;

      // Ensure to compare OTP properly (consider hashing if applicable)
      const isOtpValid = userData.otp === otp && new Date(userData.otp_expires) > new Date();

      if (isOtpValid) {
          // OTP is valid, determine redirection URL based on user role
          let redirectUrl = '';
          switch (userData.role) {
              case 'admin':
                  redirectUrl = '/dashboard';
                  break;
              case 'citizen':
                  redirectUrl = '/citizens';
                  break;
              case 'official':
                  redirectUrl = '/officials';
                  break;
              default:
                  return res.status(400).json({ error: 'Unknown user role.' });
          }

          // Clear OTP to prevent reuse
          await db.promise().query('UPDATE users SET otp = NULL, otp_expires = NULL WHERE email = ?', [email]);

          // Send success response with redirect URL
          return res.status(200).json({ message: 'OTP verified successfully!', redirectUrl });
      } else {
          return res.status(400).json({ error: 'Invalid or expired OTP.' });
      }
  } catch (error) {
      console.error('Error verifying OTP:', error.message); // Log specific error messages
      return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const email = req.session.loggedEmail; // Get the logged-in email from the session
    const userId = req.session.userId; // Get the user ID from the session
    const logId = req.session.logId; // Get the login log ID from the session

    console.log(`Attempting to logout user with email: ${email}, ID: ${userId}, and logId: ${logId}`);

    // Check if session data exists
    if (!email || !logId || !userId) {
      return res.status(400).json({ error: 'No active login session found.' });
    }

    const logoutTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');

    // Fetch the login time from the database using logId
    const [logResult] = await db.promise().query(
      'SELECT login_time FROM login_logs WHERE id = ?',
      [logId]
    );

    if (logResult.length === 0) {
      console.log('No login log found for logId:', logId);
      return res.status(404).json({ error: 'Login log not found.' });
    }

    const loginTimeFromDB = logResult[0].login_time;

    // Calculate time spent in seconds between login and logout
    const timeSpent = moment(logoutTime).diff(moment(loginTimeFromDB), 'seconds');

    // Update the login log with logout details
    const updateLogSql = `
      UPDATE login_logs
      SET logout_time = ?, time_spent = ?, message = ?
      WHERE id = ?
    `;
    await db.promise().query(updateLogSql, [logoutTime, timeSpent, 'User logged out successfully.', logId]);

    // Destroy session
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Failed to destroy session during logout.' });
      }
      console.log(`User with email ${email} logged out successfully.`);
      // Send a JSON response with the message (client will handle the redirect)
      return res.status(200).json({ message: 'Logout successful', redirect: '/login' });
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error during logout.' });
  }
});

//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Set up file storage using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST route to handle form submission
app.post('/citizen-contact', upload.single('file'), async (req, res) => {
  const { name, nationalId,email,tel, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File upload is required.' });
  }

  try {
    const filePath = path.join('uploads', file.filename);

    // Insert form data into the database
    const insertSql = `
      INSERT INTO contact_messages (fullName, national_id, email, tel, description, file_path)
      VALUES (?, ?, ?, ?)
    `;
    await db.promise().query(insertSql, [name,nationalId ,email, tel, description, filePath]);

    res.status(200).json({ message: 'Your message has been submitted successfully.' });

  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'An error occurred while submitting the form.' });
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [result] = await db.promise().query(sql, [email]);

    if (result.length === 0) {
      return res.status(400).json({ error: 'No account found with that email' });
    }

    const user = result[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = moment.tz("Africa/Kigali").add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    const updateSql = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
    await db.promise().query(updateSql, [resetToken, tokenExpiration, email]);

   // Store email and token in session
    req.session.resetEmail = email;
    req.session.resetToken = resetToken;

    // Send email with reset link
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    sendResetPasswordEmail(user.full_name, email, resetUrl);

    return res.status(200).json({ message: 'Reset token sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to send reset password email with HTML/CSS
function sendResetPasswordEmail(fullName, toEmail, resetUrl) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `${process.env.WEBSITE_NAME} <${process.env.EMAIL_USER}>`, // Sender address
    to: toEmail, // Recipient's email
    subject: 'Reset Your Password', // Email subject
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Hello ${fullName},</h2>
        <p style="color: #555;">You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p style="color: #555; margin-top: 20px;">If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p style="color: #555;"><a href="${resetUrl}" style="color: #4CAF50;">${resetUrl}</a></p>
        <p style="color: #999; font-size: 12px;">This link will expire in 30 minutes. If you did not request this reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <footer style="color: #999; font-size: 12px; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
          <p><a href="localhost:3000/privacy-policy" style="color: #999;">Privacy Policy</a>|<a href="localhost:3000/terms-conditions">Terms and Conditions</a></p>
        </footer>
      </div>
    `
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
  // Validate inputs
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Invalid request or session expired' });
  }

  try {
    // Get the current time in Africa/Kigali timezone
    const currentTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');
    console.log(currentTime);

    // Check if the token is valid and not expired
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
      AND reset_token = ?
      AND reset_token_expires > ?
    `;
    const [result] = await db.promise().query(sql, [email, token, currentTime]);

    // If no result found, the token is either invalid or expired
    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Token is valid, proceed with password reset
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token
    const updateSql = `
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL 
      WHERE email = ?
    `;
    await db.promise().query(updateSql, [hashedPassword, email]);

    // Clear session data after successful password reset
    req.session.resetEmail = null;
    req.session.resetToken = null;

    return res.status(200).json({ message: 'Password has been reset successfully!' });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
app.get('/users', (req, res) => {
  const sql = 'SELECT id, full_name, email, role FROM users';
  db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results); // Send only email and role to the frontend
  });
});

/// Update a user's role
app.put('/users/:email', (req, res) => {
  const { email } = req.params;
  const { role } = req.body;

  console.log('PUT /users/:email route hit with email:', email, 'and role:', role);

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }

  const query = 'UPDATE users SET role = ? WHERE email = ?';
  console.log('Executing query:', query, 'with values:', [role, email]);

  db.query(query, [role, email], (error, results) => {
    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Database query error.' });
    }

    console.log('Query results:', results);

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: `User with email ${email} not found.` });
    }

    res.json({ message: `User ${email}'s role updated to ${role}.` });
  });
});


// Delete a user
router.delete('/users/:email', (req, res) => {
  const { email } = req.params;

  if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
  }

  const query = 'DELETE FROM users WHERE email = ?';
  db.query(query, [email], (error, results) => {
      if (error) {
          console.error('Error deleting user:', error);
          return res.status(500).json({ error: 'Database query error.' });
      }
      res.json({ message: `User ${email} deleted successfully.` });
  });
});

// Start the server

// Start the server (make sure to include this in your main server file)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
