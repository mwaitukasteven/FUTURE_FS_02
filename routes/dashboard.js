const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { isAuthenticated } = require('../middleware/auth');

// Dashboard home
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const stats = {
            total: await Lead.countDocuments(),
            new: await Lead.countDocuments({ status: 'new' }),
            contacted: await Lead.countDocuments({ status: 'contacted' }),
            converted: await Lead.countDocuments({ status: 'converted' }),
            lost: await Lead.countDocuments({ status: 'lost' })
        };
        res.render('dashboard', { 
            user: req.user,
            stats,
            activePage: 'dashboard'
        });
    } catch (error) {
        res.status(500).send('Error loading dashboard');
    }
});

// Leads list page
router.get('/leads', isAuthenticated, async (req, res) => {
    res.render('leads', { 
        user: req.user,
        activePage: 'leads'
    });
});

// Lead detail page
router.get('/lead/:id', isAuthenticated, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).send('Lead not found');
        }
        res.render('lead-detail', { 
            user: req.user,
            lead,
            activePage: 'leads'
        });
    } catch (error) {
        res.status(500).send('Error loading lead');
    }
});

module.exports = router;