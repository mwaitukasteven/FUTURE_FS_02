const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { validateLead } = require('../middleware/validation');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public submit endpoint
router.post('/submit', validateLead, async (req, res) => {
    try {
        const lead = new Lead(req.body);
        await lead.save();
        res.json({ 
            success: true, 
            message: 'Thank you! We will contact you soon.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting form. Please try again.'
        });
    }
});

// Get all leads (API)
router.get('/leads', isAuthenticated, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const leads = await Lead.find(query).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching leads' });
    }
});

// Get single lead
router.get('/leads/:id', isAuthenticated, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching lead' });
    }
});

// Update status
router.put('/leads/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Error updating status' });
    }
});

// Add note
router.post('/leads/:id/notes', isAuthenticated, async (req, res) => {
    try {
        const { note } = req.body;
        const lead = await Lead.findById(req.params.id);
        lead.notes.push({
            note,
            addedBy: req.user.email,
            createdAt: new Date()
        });
        await lead.save();
        res.json(lead.notes);
    } catch (error) {
        res.status(500).json({ error: 'Error adding note' });
    }
});

// Delete lead
router.delete('/leads/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting lead' });
    }
});

// Create lead (manual)
router.post('/leads', isAuthenticated, async (req, res) => {
    try {
        const lead = new Lead(req.body);
        await lead.save();
        res.status(201).json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Error creating lead' });
    }
});

module.exports = router;