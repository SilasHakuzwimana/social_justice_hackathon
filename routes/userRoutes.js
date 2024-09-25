const express = require('express');
const router = express.Router();
const mysql = require('mysql');

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost', // Replace with your host
    user: 'root',      // Replace with your DB username
    password: '',      // Replace with your DB password
    database: 'civic_platform' // Replace with your DB name
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        throw err;
    }
    console.log('Connected to the database');
});

// Route to fetch all users
router.get('/users', (req, res) => {
    const query = 'SELECT email, role FROM users';

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ error: 'Database query error' });
        }

        res.json(results); // Return users in JSON format
    });
});

module.exports = router;
