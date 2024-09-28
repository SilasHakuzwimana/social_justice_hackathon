// pollRoutes.js
router.post('/create-poll', async (req, res) => {
    const { title, options } = req.body;
    
    // Insert poll
    const pollQuery = "INSERT INTO polls (title) VALUES (?)";
    const result = await db.query(pollQuery, [title]);

    const pollId = result.insertId;

    // Insert poll options
    for (const option of options) {
        const optionQuery = "INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)";
        await db.query(optionQuery, [pollId, option]);
    }
    res.status(201).json({ message: 'Poll created successfully' });
});
