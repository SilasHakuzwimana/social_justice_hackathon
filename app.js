const express = require('express');
const dotenv = require('dotenv').config();
const mysql = require('mysql2');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cors = require('cors');
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

// Register route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
  db.query(sql, [name, email, hashedPassword], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to register user' });
    }
    res.status(200).json({ message: 'User registered successfully!' });
  });
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

// Function to send OTP email
function sendOTPEmail(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Use environment variable for email
      pass: process.env.EMAIL_PASS   // Use environment variable for password
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your One-Time Password (OTP) is: ${otp}\n\nPlease enter this code to complete your login.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

// Route for OTP generation and sending
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  // Generate a 9-character alphanumeric OTP
  const otp = generateOTP();

  // Store the OTP in the database temporarily
  const updateSql = 'UPDATE users SET otp = ? WHERE email = ?';
  db.query(updateSql, [otp, email], (updateErr) => {
    if (updateErr) {
      return res.status(500).json({ error: 'Error generating OTP' });
    }
    sendOTPEmail(email, otp); // Send the OTP email
    res.status(200).json({ message: 'OTP sent to email!' });
  });
});

// Route for OTP verification
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  // Verify that the OTP matches
  const sql = 'SELECT * FROM users WHERE email = ? AND otp = ?';
  db.query(sql, [email, otp], (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Clear the OTP after successful verification
    const clearOtpSql = 'UPDATE users SET otp = NULL WHERE email = ?';
    db.query(clearOtpSql, [email], (clearErr) => {
      if (clearErr) {
        return res.status(500).json({ error: 'Error clearing OTP' });
      }

      // Redirect the user based on their role
      const user = result[0];
      if (user.role === 'citizen') {
        res.status(200).json({ message: 'OTP verified, redirecting to citizen dashboard' });
      } else if (user.role === 'official') {
        res.status(200).json({ message: 'OTP verified, redirecting to official dashboard' });
      }
    });
  });
});

module.exports = router;

// Start the server (make sure to include this in your main server file)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
