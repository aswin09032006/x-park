const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    gameUrl: { type: String, default: null },
    isComingSoon: { type: Boolean, default: false },
    sponsor: { type: String, default: 'Metamorphs' },

    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        userSchool: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numRatings: { type: Number, default: 0 }
}, { timestamps: true });

GameSchema.pre('save', function(next) {
    if (this.isModified('ratings')) {
        this.numRatings = this.ratings.length;
        if (this.numRatings > 0) {
            const totalRating = this.ratings.reduce((acc, item) => acc + item.rating, 0);
            this.averageRating = totalRating / this.numRatings;
        } else {
            this.averageRating = 0;
        }
    }
    next();
});

module.exports = mongoose.model('Game', GameSchema);