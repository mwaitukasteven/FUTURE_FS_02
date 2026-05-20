// scripts/setup.js
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function setup() {
    console.log('\n🔧 Mini CRM Setup Wizard\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (adminExists) {
            console.log('⚠️ Admin already exists!');
            const answer = await question('Do you want to create another admin? (y/n): ');
            if (answer.toLowerCase() !== 'y') {
                console.log('Setup cancelled');
                process.exit(0);
            }
        }
        
        console.log('\n📝 Enter admin details:\n');
        
        const name = await question('Full name: ');
        const email = await question('Email address: ');
        const password = await question('Password: ');
        
        await User.create({
            name,
            email,
            password,
            role: 'admin'
        });
        
        console.log('\n✅ Admin created successfully!\n');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}\n`);
        console.log('You can now login at: http://localhost:3000/login\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        rl.close();
    }
}

setup();