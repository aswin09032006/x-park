const mongoose = require('mongoose');

const createSlug = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const SchoolSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    capacity: { type: Number, default: 100 },
    // --- ADDED ---
    city: { type: String, default: '' },
    county: { type: String, default: '' }
}, { timestamps: true });

SchoolSchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = createSlug(this.name);
    }
    next();
});

module.exports = mongoose.model('School', SchoolSchema);
