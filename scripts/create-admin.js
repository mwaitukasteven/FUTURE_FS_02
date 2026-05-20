// scripts/create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Get admin details from command line arguments
        const email = process.argv[2] || process.env.ADMIN_EMAIL;
        const password = process.argv[3] || process.env.ADMIN_PASSWORD;
        const name = process.argv[4] || 'Administrator';
        
        // Check if admin exists
        const existingAdmin = await User.findOne({ email });
        
        if (existingAdmin) {
            console.log(`⚠️ Admin with email ${email} already exists`);
            process.exit(0);
        }
        
        // Create admin
        const admin = await User.create({
            email,
            password,
            name,
            role: 'admin'
        });
        
        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`👤 Name: ${name}`);
        
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin();