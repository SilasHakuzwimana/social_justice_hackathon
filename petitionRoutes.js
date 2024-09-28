const express = require('express');
const router = express.Router();
const db = require('./db'); // Assume db is connected to MySQL

// Create Petition
router.post('/create-petition', async (req, res) => {
    const { title, description, target_signatures } = req.body;
    const query = "INSERT INTO petitions (title, description, target_signatures) VALUES (?, ?, ?)";
    await db.query(query, [title, description, target_signatures]);
    res.status(201).json({ message: 'Petition created successfully' });
});

// Sign Petition
router.post('/sign-petition', async (req, res) => {
    const { user_id, petition_id } = req.body;
    
    // Check if user already signed
    const checkQuery = "SELECT * FROM petition_signatures WHERE user_id = ? AND petition_id = ?";
    const checkResult = await db.query(checkQuery, [user_id, petition_id]);
    
    if (checkResult.length > 0) {
        return res.status(400).json({ message: "You've already signed this petition" });
    }

    // Add signature
    const insertQuery = "INSERT INTO petition_signatures (user_id, petition_id) VALUES (?, ?)";
    await db.query(insertQuery, [user_id, petition_id]);

    // Track signatures
    const countQuery = "SELECT COUNT(*) as signatures FROM petition_signatures WHERE petition_id = ?";
    const countResult = await db.query(countQuery, [petition_id]);

    res.status(200).json({ message: "Signed successfully", signatures: countResult[0].signatures });
});
