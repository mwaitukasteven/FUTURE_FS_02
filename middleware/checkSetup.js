// middleware/checkSetup.js
const User = require('../models/User');

const checkSetup = async (req, res, next) => {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists && req.path !== '/register' && req.path !== '/login') {
        return res.redirect('/register');
    }
    next();
};

module.exports = checkSetup;