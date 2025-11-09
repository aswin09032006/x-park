const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Schema = mongoose.Schema;

const GameProgressSchema = new Schema({
    completedLevels: { type: Map, of: Boolean, default: {} },
    highScores: { type: Map, of: Number, default: {} },
    badges: { type: Map, of: String, default: {} },
    xp: { type: Map, of: Number, default: {} },
    certificates: { type: Map, of: Boolean, default: {} }
}, { _id: false });

const UserSchema = new Schema({
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['student', 'schooladmin', 'superadmin'], default: 'student' },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    isApproved: { type: Boolean, default: function() { return this.role !== 'student' || !this.school; } },
    isVerified: { type: Boolean, default: false },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    // --- UPDATED: Added nickname field ---
    nickname: { type: String, default: '' },
    avatar: { style: { type: String, enum: ['initials', 'placeholder'], default: 'initials' } },
    displayName: { type: String, default: '' },
    city: { type: String, default: '' },
    county: { type: String },
    studentId: { type: String, default: '' },
    yearGroup: { type: Number, default: 0 },
    landingPagePreference: { type: String, default: 'Dashboard' },
    isFirstLogin: { type: Boolean, default: true },
    verificationCode: String,
    verificationCodeExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    savedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    playedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    gameData: { type: Map, of: GameProgressSchema, default: {} },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
    next();
});

UserSchema.methods.matchPassword = async function (p) { return await bcrypt.compare(p, this.password); };

UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);