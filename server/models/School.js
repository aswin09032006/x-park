const mongoose = require('mongoose');

// A simple function to create a URL-friendly slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const SchoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    // --- NEW: Add capacity field for total users ---
    capacity: {
        type: Number,
        default: 100 // Default capacity
    }
}, { timestamps: true });

// Middleware to automatically generate the slug from the name before saving
SchoolSchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = createSlug(this.name);
    }
    next();
});

module.exports = mongoose.model('School', SchoolSchema);