const express = require('express');
const Report = require('../models/Report'); // Report model
const router = express.Router();

// POST route to submit a report
router.post('/submit', (req, res) => {
    const { project, description, imageUrl } = req.body;
  
    const sql = `INSERT INTO reports (project_id, description, image_url, status)
                 VALUES (?, ?, ?, 'Pending')`;
    db.query(sql, [project, description, imageUrl], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to submit report' });
      }
      res.status(200).json({ message: 'Report submitted successfully!' });
    });
  });

  router.get('/projects', (req, res) => {
    const sql = 'SELECT * FROM projects';
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.status(200).json(results);
    });
  });

  
  module.exports = router;