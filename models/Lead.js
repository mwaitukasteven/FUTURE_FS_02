const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'converted', 'lost'],
        default: 'new'
    },
    notes: [{
        note: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        addedBy: String
    }],
    source: {
        type: String,
        default: 'Website Contact Form'
    },
    convertedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

leadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.status === 'converted' && !this.convertedAt) {
        this.convertedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Lead', leadSchema);