const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                return next();
            }
        } catch (error) {
            console.error(error);
        }
    }
    res.redirect('/login');
};

const isAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
};

module.exports = { isAuthenticated, isAdmin };