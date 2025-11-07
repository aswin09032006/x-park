const mongoose = require('mongoose');
const crypto = require('crypto');

const PreRegisteredStudentSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true, lowercase: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, trim: true, default: null },
    yearGroup: { type: Number, default: null },
    registrationToken: { type: String, unique: true, sparse: true },
    registrationTokenExpires: { type: Date },
    status: { type: String, enum: ['pending', 'registered'], default: 'pending' }
}, { timestamps: true });

PreRegisteredStudentSchema.index({ email: 1, school: 1 }, { unique: true });
PreRegisteredStudentSchema.index({ username: 1 }, { unique: true, sparse: true });

PreRegisteredStudentSchema.methods.getRegistrationToken = function() {
    const token = crypto.randomBytes(20).toString('hex');
    this.registrationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.registrationTokenExpires = Date.now() + 14 * 24 * 60 * 60 * 1000;
    return token;
};

module.exports = mongoose.model('PreRegisteredStudent', PreRegisteredStudentSchema);