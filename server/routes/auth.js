const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userMethods } = require('../db');

// Login/Register combined endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await userMethods.findUser(username);
        
        if (!user) {
            // User doesn't exist, create new account
            const newUser = await userMethods.createUser(username, password);
            const token = jwt.sign(
                { userId: newUser.id, username: newUser.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(201).json({
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username
                },
                message: 'Account created successfully!'
            });
        }

        // User exists, verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                message: 'Invalid password',
                isWrongPassword: true
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username
            },
            message: 'Welcome back!'
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;