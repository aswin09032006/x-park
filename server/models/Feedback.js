const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: [true, 'Feedback message cannot be empty.'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new',
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);