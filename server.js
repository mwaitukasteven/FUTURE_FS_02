require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Security middleware (with relaxed CSP for demo)
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to check and create default admin
async function initializeAdmin() {
    try {
        const User = require('./models/User');
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            console.log('\n⚠️  No admin user found in database!');
            console.log('📝 You can create an admin by:');
            console.log('   1. Visiting: http://localhost:' + process.env.PORT + '/register');
            console.log('   2. Or using default credentials from .env file\n');
            
            // Optional: Auto-create from .env (uncomment if you want this)
            /*
            const defaultAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
            if (!defaultAdmin) {
                await User.create({
                    email: process.env.ADMIN_EMAIL,
                    password: process.env.ADMIN_PASSWORD,
                    name: 'Administrator',
                    role: 'admin'
                });
                console.log('✅ Default admin created from .env file');
            }
            */
        } else {
            console.log('✅ Admin user already exists in database');
            console.log(`📧 Admin email: ${adminExists.email}`);
        }
    } catch (error) {
        console.error('Error checking admin:', error.message);
    }
}

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        initializeAdmin(); // Check admin on startup
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/', authRoutes);
app.use('/api', leadRoutes);
app.use('/dashboard', dashboardRoutes);

// Public test form
app.get('/test-form', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Contact Form</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .form-container {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 100%;
                    padding: 40px;
                }
                h2 {
                    color: #333;
                    margin-bottom: 10px;
                }
                .subtitle {
                    color: #666;
                    margin-bottom: 30px;
                    font-size: 14px;
                }
                input, textarea {
                    width: 100%;
                    padding: 12px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                }
                button {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: transform 0.2s;
                }
                button:hover {
                    transform: translateY(-2px);
                }
                .success { 
                    color: #10b981; 
                    margin-top: 15px; 
                    text-align: center; 
                    padding: 10px;
                    background: #d1fae5;
                    border-radius: 8px;
                }
                .error { 
                    color: #ef4444; 
                    margin-top: 15px; 
                    text-align: center;
                    padding: 10px;
                    background: #fee2e2;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h2>📋 Contact Us</h2>
                <p class="subtitle">Fill this form and we'll get back to you within 24 hours</p>
                <form id="leadForm">
                    <input type="text" name="name" placeholder="Full Name" required>
                    <input type="email" name="email" placeholder="Email Address" required>
                    <input type="tel" name="phone" placeholder="Phone Number" required>
                    <textarea name="message" placeholder="Your message..." rows="4" required></textarea>
                    <button type="submit">Submit Lead</button>
                </form>
                <div id="result"></div>
            </div>
            <script>
                document.getElementById('leadForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData);
                    const resultDiv = document.getElementById('result');
                    
                    try {
                        const response = await fetch('/api/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        const result = await response.json();
                        if (result.success) {
                            resultDiv.innerHTML = '<div class="success">✓ ' + result.message + '</div>';
                            e.target.reset();
                        } else {
                            resultDiv.innerHTML = '<div class="error">✗ ' + result.message + '</div>';
                        }
                    } catch (error) {
                        resultDiv.innerHTML = '<div class="error">✗ Error submitting form. Please try again.</div>';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Home redirect
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`
        <h1>Something went wrong!</h1>
        <p>${err.message}</p>
        <a href="/">Go Home</a>
    `);
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go Home</a>
    `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('   MINI CRM SYSTEM - SERVER RUNNING');
    console.log('========================================\n');
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}/login`);
    console.log(`📝 Test Form: http://localhost:${PORT}/test-form`);
    console.log(`👤 Create Admin: http://localhost:${PORT}/register\n`);
    console.log('💡 Quick Start:');
    console.log('   1. If no admin exists, visit /register to create one');
    console.log('   2. Login with your admin credentials');
    console.log('   3. Start managing leads!\n');
});