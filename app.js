const express = require('express');
const session = require('express-session');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/citizen-reports', (req, res) =>{
  res.sendFile(__dirname + '/public/citizen_reports.html');
})
app.get('/platform-resources', (req, res) =>{
  res.sendFile(__dirname + '/public/resources.html');
})
app.get('/login',(req,res) => {
  res.sendFile(__dirname + '/public/login.html');
})
app.get('/citizen-contact', (req, res) =>{
  res.sendFile(__dirname + '/public/citizen_contact.html');
})
app.get('/citizens-messages', (req, res) =>{
  res.sendFile(__dirname + '/public/officials_messages.html');
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
app.get('/official-updates',(req,res) =>{
  res.sendFile(__dirname + '/public/officials_updates.html');
})
app.get('/official-reports',(req,res) =>{
  res.sendFile(__dirname + '/public/officials_reports.html')
})
app.get('/citizens',(req,res) =>{
  res.sendFile(__dirname + '/public/citizens.html');
})
app.get('/privacy-policy',(req,res) =>{
  res.sendFile(__dirname + '/public/privacy_policy.html');
})
app.get('/terms-conditions',(req,res) =>{
  res.sendFile(__dirname + '/public/terms_and_conditions.html');
})
app.get('/citizen-resources',(req, res) =>{
  res.sendFile(__dirname + '/public/citizen_resources.html');
})
app.get('/about',(req,res) =>{
  res.sendFile(__dirname + '/public/about.html');
})

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the "reports" directory
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Serve static files from the "resources" directory
app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

//DB connection
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
    db.query(sql, [fullName, email, nationalId, location, phone, hashedPassword], (err) => {
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
      db.query(sql, [fullName, new_user_email, nationalId, location, phone, hashedPassword, new_user_role], (err) => {
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
              <div class="footer">
                  <p>If you have any questions or need assistance, please <a href="#">contact our support team</a>.</p>
                  <p>Thank you for using our service!</p>
                  <footer>
                    <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
                    <p><a href="http://localhost:3000/privacy-policy">Privacy Policy</a> | <a href="http://localhost:3000/terms-conditions">Terms and Conditions</a></p>
                  </footer>
              </div>
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
    req.session.logId = logResult.insertId;
    req.session.loggedInUserId = user.id;// Store logId for logout tracking

    if (user) {
      // Store user data in session
      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        national_id: user.national_id,
        role: user.role,
        email: user.email
      };
    }
    const userID = user.national_id;
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
    const { name, nationalId, email, tel, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File upload is required.' });
    }

    try {
      const filePath = path.join('uploads', file.filename).replace(/\\/g, '/');

      // Insert form data into the database
      const insertSql = `
        INSERT INTO contact_messages (fullName, national_id, email, tel, description, file_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.promise().query(insertSql, [name, nationalId, email, tel, description, filePath]);

      // Prepare and send the confirmation email
      const message = 'You have contacted your officials. They will reach out to you soon.';
      sendEmail(email, filePath, message);

      res.status(200).json({ message: 'Your message has been submitted successfully.' });

    } catch (error) {
      console.error('Error saving contact message:', error);
      res.status(500).json({ error: 'An error occurred while submitting the form.' });
    }
  });

  // Function to send email with a link to the uploaded file
  function sendEmail(toEmail, filePath, message) {
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
      subject: 'Message Sent to Civic Accountability Platform',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message Sent</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #0a58ca;
              padding: 20px;
              color: white;
              text-align: center;
            }
            .message {
              margin-top: 20px;
              font-size: 16px;
              line-height: 1.5;
            }
            .cta {
              margin-top: 20px;
              text-align: center;
            }
            .cta a {
              background-color: #0a58ca;
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              text-decoration: none;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Submission</h1>
            </div>
            <div class="message">
              <p>Hello,</p>
              <p>Thank you for reaching out to your officials. We have received your message and we will review it soon.</p>
              <p>If you uploaded any file, you can view it here:</p>
              <div class="cta">
                <a href="http://localhost:3000/${filePath}" target="_blank">View Uploaded File</a>
              </div>
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
              <p><a href="http://localhost:3000/privacy-policy">Privacy Policy</a> | <a href="http://localhost:3000/terms-conditions">Terms and Conditions</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }


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
            <p><a href="http://localhost:3000/privacy-policy">Privacy Policy</a> | <a href="http://localhost:3000/terms-conditions">Terms and Conditions</a></p>
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
  db.query(query, [email], (error) => {
      if (error) {
          console.error('Error deleting user:', error);
          return res.status(500).json({ error: 'Database query error.' });
      }
      res.json({ message: `User ${email} deleted successfully.` });
  });
});

app.get('/citizen-messages', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT fullName, national_id, email, tel, description, file_path, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'An error occurred while fetching messages.' });
  }
});
app.delete('/citizen-messages/:national_id', async (req, res) => {
  const { national_id } = req.params;
  try {
    const result = await db.promise().query(`
      DELETE FROM contact_messages WHERE national_id = ?
    `, [national_id]);
    
    if (result[0].affectedRows > 0) {
      res.status(200).json({ message: 'Message deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Message not found.' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'An error occurred while deleting the message.' });
  }
});
app.post('/send-response', (req, res) => {
  const { email, message } = req.body;
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
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Response to Your Message',
    text: `Dear Citizen,\n\n${message}\n\nBest regards,\nCivic Accountability Platform`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    console.log('Email sent: ' + info.response);
    res.status(200).json({ success: 'Response sent successfully' });
  });
});

// Function to send email with a link to the uploaded file for update
function sendUpdate(toEmail, emailSubject, emailBody, userName) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
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
    subject: emailSubject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Sent</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #0a58ca;
            padding: 20px;
            color: white;
            text-align: center;
          }
          .message {
            margin-top: 20px;
            font-size: 16px;
            line-height: 1.5;
          }
          .cta {
            margin-top: 20px;
            text-align: center;
          }
          .cta a {
            background-color: #0a58ca;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emailSubject}</h1>
          </div>
          <div class="message">
            <p>Dear, ${userName}</p>
            <p>Email: ${toEmail}</p>
            <br>
            <p>${emailBody}</p>
            <br>
            <p>Thank you for providing this update to your community.</p>
            <p>This is to let you know that it has been saved successfully. You can now decide whether to publish or not.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
            <p><a href="http://localhost:3000/privacy-policy">Privacy Policy</a> | <a href="http://localhost:3000/terms-conditions">Terms and Conditions</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

app.post('/officials-updates', async (req, res) => {
  const official = req.session.user;

  if (!official) {
      return res.status(401).json({ error: 'User not logged in' });
  }

  const officialId = official.id;

  const { title, content } = req.body;

  try {
      const nationalId = official.national_id;
      const email = official.email;
      const userName = official.full_name;
      
      // Insert the update along with email and national_id
      await db.promise().query('INSERT INTO official_updates (title, content, created_by, email, national_id) VALUES (?, ?, ?, ?, ?)', [title, content, officialId, email, nationalId]);

      // Log the update in official_logs
      await db.promise().query('INSERT INTO official_logs (official_id, national_id, action_type, title) VALUES (?, ?, ?, ?)',
          [officialId, nationalId, 'update', title]);

      // Send email to the official
      const emailSubject = 'Update Submitted Successfully';
      const emailBody = `
                      <p>We are pleased to inform you that your report titled "<strong>${title}</strong>" has been successfully submitted to the Civic Accountability Platform.</p>
                      <p>We sincerely appreciate your contribution to enhancing civic engagement and transparency within the community.</p>
                      `;

      await sendUpdate(official.email, emailSubject, emailBody, official.full_name); // Send email using official's email

      res.status(201).json({ message: 'Update submitted successfully!' });
  } catch (error) {
      console.error('Error submitting update:', error);
      res.status(500).json({ error: 'An error occurred while submitting the update.' });
  }
});

// Configure Multer for report file storage
const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'reports/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Ensure the directory is created recursively
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadReport = multer({ storage: reportStorage });

app.post('/officials-reports', uploadReport.single('reportFile'), async (req, res) => {
  const official = req.session.user;
  const reportFile = req.file;

  if (!official) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  const { title, description } = req.body;

  // Validate if a file has been uploaded
  if (!reportFile) {
    return res.status(400).json({ error: 'File upload is required.' });
  }

  try {
      // Construct the file path
      const reportFilePath = path.join('reports', reportFile.filename).replace(/\\/g, '/');
      const userId = official.id;
      const nationalId = official.national_id;
      const email = official.email;
      const userName = official.full_name;

    // Insert the report into the database
    await db.promise().query(
      'INSERT INTO official_reports (title, description, file_path, created_by, email, national_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, reportFilePath, userId, email, nationalId]
    );

    // Log the report in official_logs
    await db.promise().query(
      'INSERT INTO official_logs (official_id, national_id, action_type, title, file_path) VALUES (?, ?, ?, ?, ?)',
      [userId, nationalId, 'report', title, reportFilePath]
    );

    // Send confirmation email to the official
    const emailSubject = 'Report Submitted Successfully';
    const emailBodyReport = `
                      <p>We are pleased to inform you that your report titled "<strong>${title}</strong>" has been successfully submitted to the Civic Accountability Platform.</p>
                      <p>We sincerely appreciate your contribution to enhancing civic engagement and transparency within the community.</p>
                      `;

    await sendReport(email, emailSubject, reportFilePath , userName, emailBodyReport); // Send email with the report details

    res.status(201).json({ message: 'Report submitted successfully!' });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'An error occurred while submitting the report.' });
  }
});

// Function to send email with a link to the uploaded file for official report
function sendReport(toEmail, emailSubject, reportFilePath, userName, emailBody) {
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
    subject: emailSubject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Sent</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #0a58ca;
            padding: 20px;
            color: white;
            text-align: center;
          }
          .message {
            margin-top: 20px;
            font-size: 16px;
            line-height: 1.5;
          }
          .cta {
            margin-top: 20px;
            text-align: center;
          }
          .cta a {
            background-color: #0a58ca;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emailSubject}</h1>
          </div>
          <div class="message">
            <p>Hello, ${userName}</p>
            <p>Email: ${toEmail}</p>
            <br>
             <p>${emailBody}</p>
            <p>You can view and download your report by clicking the link below:</p>
            <div class="cta">
              <a href="http://localhost:3000/${reportFilePath}" target="_blank">View Uploaded File</a>
            </div>
             <p>Best regards,</p>
             <p>The ${process.env.WEBSITE_NAME} Team</p>

          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Civic Accountability Platform. All rights reserved.</p>
            <p><a href="http://localhost:3000/privacy-policy">Privacy Policy</a> | <a href="http://localhost:3000/terms-conditions">Terms and Conditions</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// Multer configuration for file uploads
const ResourceStorage = multer.diskStorage({
  destination: (req, resourceFile, cb) => {
    const uploadDir = 'resources/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Creates the directory recursively if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, resourceFile, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, resourceFile.fieldname + '-' + uniqueSuffix + path.extname(resourceFile.originalname)); // Correct fieldname reference
  }
});

// Multer middleware to handle file uploads
const uploadResource = multer({ storage: ResourceStorage });

// Route to save best practices, outreach programs, and training materials
app.post('/save-resource', uploadResource.single('resourceFile'), async (req, res) => {
  const official = req.session.user; // Assuming session is set up

  if (!official) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  const { title, description, category } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'File upload is required.' });
  }

  const file_path = path.join('resources', file.filename).replace(/\\/g, '/');

  try {
    const userId = official.id;
    const email = official.email;
    const nationalId = official.national_id;

    await db.promise().query(
      'INSERT INTO official_resources (title, description, category, file_path, created_by, email, national_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, category, file_path, userId, email, nationalId]
    );

    res.status(201).json({ message: 'Resource saved successfully!' });
  } catch (error) {
    console.error('Error saving resource:', error);
    res.status(500).json({ error: 'An error occurred while saving the resource.' });
  }
});
// Route to get resources by category
app.get('/resources/:category', async (req, res) => {
  const category = req.params.category;

  try {
    const [rows] = await db.promise().query(
      'SELECT title, description, file_path FROM official_resources WHERE category = ?',
      [category]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No resources found for this category.' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error retrieving resources:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the resources.' });
  }
});

app.get('/government-reports', async (req, res) => {
  try {
      // Query the database to get all reports with status 'published'
      const [reports] = await db.promise().query(
          'SELECT title, description, file_path FROM official_reports WHERE status = ?',
          ['published']
      );

      if (reports.length === 0) {
          return res.status(404).json({ message: 'No published reports found.' });
      }

      // Send the results as JSON response
      res.status(200).json(reports);
  } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'An error occurred while fetching reports.' });
  }
});
app.get('/government-official-reports', async (req, res) => {
  const official = req.session.user;
  try {
    const OfficialId = official.id;
      // Query the database to get all reports with status 'published'
      const [reports] = await db.promise().query(
          'SELECT * FROM official_reports WHERE created_by = ?',
          [OfficialId]
      );

      if (reports.length === 0) {
          return res.status(404).json({ message: 'No reports found.' });
      }

      // Send the results as JSON response
      res.status(200).json(reports);
  } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'An error occurred while fetching reports.' });
  }
});
// DELETE route to remove a report by ID
// routes.js
app.delete('/delete-report/:id', async (req, res) => {
  const reportId = req.params.id;

  try {
      const [result] = await db.query('DELETE FROM official_reports WHERE id = ?', [reportId]);

      if (result.affectedRows > 0) {
          res.status(200).json({ message: 'Report deleted successfully' });
      } else {
          res.status(404).json({ message: 'Report not found' });
      }
  } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

app.post('/polls', (req, res) => {
  const { title, question, options } = req.body;
  const creatorId = req.session.user.id;
  const createdBy = req.session.user.national_id;  // National ID from session

  const query = `
      INSERT INTO polls (title, question, options, creator_id, created_by)
      VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [title, question, JSON.stringify(options), creatorId, createdBy], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error creating poll' });
      res.status(201).json({ message: 'Poll created successfully' });
  });
  if(!err) res.status(200).json({ message:`You have created the poll ${result}`})
});

app.get('/polls', (req, res) => {
  const query = 'SELECT * FROM polls';
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error retrieving polls' });
      res.status(200).json(results);
  });
});


app.post('/polls/:pollId/vote', (req, res) => {
  const pollId = req.params.pollId;
  const { optionId } = req.body;
  const userId = req.session.user.id;

  // Prevent duplicate voting
  const checkVoteQuery = `
      SELECT * FROM poll_votes WHERE user_id = ? AND poll_id = ?
  `;
  db.query(checkVoteQuery, [userId, pollId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error checking vote' });
      if (result.length > 0) return res.status(400).json({ error: 'User has already voted' });

      // Insert vote
      const voteQuery = `
          INSERT INTO poll_votes (user_id, poll_id, option_id)
          VALUES (?, ?, ?)
      `;
      db.query(voteQuery, [userId, pollId, optionId], (err, result) => {
          if (err) return res.status(500).json({ error: 'Error voting' });
          res.status(201).json({ message: 'Vote recorded successfully' });
      });
  });
});

app.post('/petitions', (req, res) => {
  const { title, description } = req.body;
  const creatorId = req.session.user.id;
  const createdBy = req.session.user.national_id;

  const query = `
      INSERT INTO petitions (title, description, creator_id, created_by)
      VALUES (?, ?, ?, ?)
  `;
  db.query(query, [title, description, creatorId, createdBy], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error creating petition' });
      res.status(201).json({ message: 'Petition created successfully' });
  });
});

// Route for fetching petition progress
app.get('/petition-progress/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // Fetch petition details
      const [petitionRows] = await db.promise().query('SELECT * FROM petitions WHERE id = ?', [id]);
      if (petitionRows.length === 0) {
          return res.status(404).json({ message: 'Petition not found' });
      }

      const petition = petitionRows[0];

      // Fetch poll options
      const [optionsRows] = await db.promise().query('SELECT * FROM poll_options WHERE poll_id = ?', [id]);

      // Fetch signature count
      const [signatureCountRows] = await db.promise().query('SELECT COUNT(*) AS totalSignatures FROM petition_signatures WHERE petition_id = ?', [id]);
      const totalSignatures = signatureCountRows[0].totalSignatures;

      res.status(200).json({
          title: petition.title,
          description: petition.description,
          pollOptions: optionsRows,
          totalSignatures,
          signatureGoal: petition.signature_goal
      });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching petition progress', error });
  }
});


app.post('/petitions/:petitionId/sign', (req, res) => {
  const petitionId = req.params.petitionId;
  const userId = req.session.user.id;
  const signedBy = req.session.user.national_id;

  // Check if user has already signed
  const checkSignatureQuery = `
      SELECT * FROM petition_signatures WHERE petition_id = ? AND user_id = ?
  `;
  db.query(checkSignatureQuery, [petitionId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error checking signature' });
      if (result.length > 0) return res.status(400).json({ error: 'User has already signed' });

      // Insert signature
      const signatureQuery = `
          INSERT INTO petition_signatures (petition_id, user_id, signed_by)
          VALUES (?, ?, ?)
      `;
      db.query(signatureQuery, [petitionId, userId, signedBy], (err, result) => {
          if (err) return res.status(500).json({ error: 'Error signing petition' });
          res.status(201).json({ message: 'Petition signed successfully' });
      });
  });
});

app.get('/petitions', (req, res) => {
  const query = 'SELECT * FROM petitions';
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error retrieving petitions' });
      res.status(200).json(results);
  });
});

app.post('/feedback', (req, res) => {
  const { message } = req.body;
  const userId = req.session.user.id;
  const sentBy = req.session.user.national_id;

  const query = `
      INSERT INTO feedback (message, user_id, sent_by)
      VALUES (?, ?, ?)
  `;
  db.query(query, [message, userId, sentBy], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error submitting feedback' });
      res.status(201).json({ message: 'Feedback submitted successfully' });
  });
});

app.get('/feedback', (req, res) => {
  const query = 'SELECT * FROM feedback';
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error retrieving feedback' });
      res.status(200).json(results);
  });
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
      return next();
  } else {
      return res.status(401).json({ error: 'Unauthorized access' });
  }
}

// Use the middleware for all protected routes
app.post('/polls', isAuthenticated, (req, res, next) => { /* ... */ });
app.post('/polls/:pollId/vote', isAuthenticated, (req, res, next) => { /* ... */ });
app.post('/petitions', isAuthenticated, (req, res, next) => { /* ... */ });
app.post('/feedback', isAuthenticated, (req, res, next) => { /* ... */ });

app.post('/logout', async (req, res) => {
  try {
    const email = req.session.loggedEmail; // Get the logged-in email from the session
    const userId = req.session.userId; // Get the user ID from the session
    const logId = req.session.logId; // Get the login log ID from the session

    console.log(`Attempting to logout user with email: ${email}, ID: ${userId}, and logId: ${logId}`);

    // Check if session data exists
    if (!email || !logId || !userId) {
      return res.status(403).json({ error: 'No active login session found.' }); // Changed status to 403
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


// Start the server (make sure to include this in your main server file)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
