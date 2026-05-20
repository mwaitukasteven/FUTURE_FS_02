const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login page
router.get('/login', async (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    // Check if any admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    res.render('login', { 
        error: null,
        noAdmin: adminCount === 0  // Pass this to show registration link
    });
});

// Process login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.render('login', { 
                error: 'Please enter both email and password',
                noAdmin: false
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('login', { 
                error: 'Invalid email or password',
                noAdmin: false
            });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.render('login', { 
                error: 'Invalid email or password',
                noAdmin: false
            });
        }
        
        // Set session
        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.userName = user.name;
        
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            error: 'An error occurred. Please try again.',
            noAdmin: false
        });
    }
});

// Registration page (only available if no admin exists)
router.get('/register', async (req, res) => {
    try {
        // Check if any admin already exists
        const adminCount = await User.countDocuments({ role: 'admin' });
        
        // If admin exists, redirect to login
        if (adminCount > 0) {
            return res.redirect('/login');
        }
        
        // No admin exists, show registration form
        res.render('register', { 
            error: null, 
            success: null 
        });
    } catch (error) {
        console.error('Register page error:', error);
        res.status(500).send('Error loading registration page');
    }
});

// Process registration (creates first admin)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        
        // Validation
        if (!name || !email || !password) {
            return res.render('register', {
                error: 'Please fill in all fields',
                success: null
            });
        }
        
        // Check if password is strong enough
        if (password.length < 6) {
            return res.render('register', {
                error: 'Password must be at least 6 characters long',
                success: null
            });
        }
        
        // Check if passwords match (if confirmPassword field exists)
        if (confirmPassword && password !== confirmPassword) {
            return res.render('register', {
                error: 'Passwords do not match',
                success: null
            });
        }
        
        // Check if email is valid
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.render('register', {
                error: 'Please enter a valid email address',
                success: null
            });
        }
        
        // Check if any admin already exists (security check)
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount > 0) {
            return res.status(403).send('Setup already completed. Only one admin can be created.');
        }
        
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', {
                error: 'User with this email already exists',
                success: null
            });
        }
        
        // Create admin user
        const admin = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: 'admin'
        });
        
        console.log('✅ New admin created:', admin.email);
        
        // Show success message
        res.render('register', {
            error: null,
            success: 'Admin account created successfully! You can now login.'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', {
            error: 'Error creating admin: ' + error.message,
            success: null
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Forgot password route (optional)
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null, success: null });
});

// Check session status (for frontend)
router.get('/api/session', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true, 
            user: {
                id: req.session.userId,
                role: req.session.userRole,
                name: req.session.userName
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;