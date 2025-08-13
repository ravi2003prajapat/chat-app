    const express = require('express');
    const { loginAgent, registerAgent } = require('../controllers/authAgentController');
    const router = express.Router();

    router.post('/login', loginAgent);
    router.post('/register', registerAgent);

    module.exports = router;

    