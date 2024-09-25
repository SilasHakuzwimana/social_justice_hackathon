const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const router = express.Router();
const cors = require('cors');
const crypto = require('crypto');
const moment = require('moment-timezone');
const userRoutes = require('./routes/userRoutes');
const { body, validationResult } = require('express-validator');
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

app.use('/api', userRoutes);

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
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Use environment variable for email
        pass: process.env.EMAIL_PASS  // Use environment variable for password
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
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

    req.session.loggedEmail = email;

    // Generate OTP
    const otp = generateOTP();

    const otpExpirationTime = moment.tz("Africa/Kigali").add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    const updateSql = 'UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?';
    await db.promise().query(updateSql, [otp, otpExpirationTime, email]);

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

      // Check if OTP matches and has not expired
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


//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({ error: 'Something went wrong!' });
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

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
    // Send email with resetUrl (implementation not shown here)

    return res.status(200).json({ message: 'Reset token sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// Function to send reset password email with HTML/CSS
function sendResetPasswordEmail(fullName, toEmail, resetUrl) {
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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Hello ${fullName},</h2>
        <p style="color: #555;">You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p style="color: #555; margin-top: 20px;">If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p style="color: #555;"><a href="${resetUrl}" style="color: #4CAF50;">${resetUrl}</a></p>
        <p style="color: #999; font-size: 12px;">This link will expire in one hour. If you did not request this reset, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <footer style="color: #999; font-size: 12px; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p><a href="https://civicaccounatbilityplatform.com/privacy-policy" style="color: #999;">Privacy Policy</a></p>
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
  const {newPassword } = req.body;
  // Retrieve email and token from session
  const email = req.session.resetEmail;  // Ensure this is set before this route is accessed
  const token = req.session.resetToken;   // Ensure this is set before this route is accessed

  const currentEATTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');
  if (!email || !token || !newPassword || token.length<10) {
      return res.status(400).json({ error: 'Invalid request or session expired' });
  }

  try {
      const sql = `SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > Now()`;
      const [result] = await db.promise().query(sql, [email, token]);

      if (result.length === 0) {
          return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateSql = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?';
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
