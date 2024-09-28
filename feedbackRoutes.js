const express = require('express');
const router = express.Router();
const db = require('./db');  // Assume db is connected to MySQL
const nodemailer = require('nodemailer');

// Configure Nodemailer transport (Gmail example, replace with your SMTP server details)
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

router.post('/submit-feedback', async (req, res) => {
    const { user_id, issue, feedback_text } = req.body;

    try {
        // Get user details (assuming user_id is from a logged-in session)
        const userQuery = "SELECT email, name FROM users WHERE id = ?";
        const userResult = await db.query(userQuery, [user_id]);
        const user = userResult[0]; // Get the user who submitted the feedback

        // Get the official details (this could be dynamic or based on the issue)
        const officialQuery = "SELECT email FROM officials WHERE issue = ?";
        const officialResult = await db.query(officialQuery, [issue]);
        const officialEmail = officialResult[0]?.email;

        if (!officialEmail) {
            return res.status(400).json({ message: 'No official found for this issue' });
        }

        // Insert feedback into the database
        const insertQuery = "INSERT INTO feedback (user_id, issue, feedback_text) VALUES (?, ?, ?)";
        await db.query(insertQuery, [user_id, issue, feedback_text]);

        // Send email to the official
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Sender email
            to: officialEmail,             // Official's email
            subject: `New Feedback on ${issue}`,  // Email subject
            text: `
                New feedback has been submitted by ${user.name} (${user.email}) on the issue of "${issue}":
                ---------------------------
                ${feedback_text}
                ---------------------------
                Please review the feedback in the official dashboard.
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'Feedback submitted and email sent to the official' });
    } catch (error) {
        console.error('Error submitting feedback: ', error);
        res.status(500).json({ message: 'Error submitting feedback and sending email' });
    }
});

module.exports = router;
