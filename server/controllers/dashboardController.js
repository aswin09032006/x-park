// --- /backend/controllers/dashboardController.js ---
const User = require('../models/User');
const Game = require('../models/Game');
const School = require('../models/School');
const mongoose = require('mongoose');

// @desc    Get aggregated statistics for a school admin's dashboard
// @route   GET /api/dashboard/school-admin
// @access  Private (School Admin)
exports.getSchoolAdminDashboardStats = async (req, res) => {
    try {
        const adminSchoolId = req.user.school;

        const school = await School.findById(adminSchoolId).select('name');
        if (!school) {
            return res.status(404).json({ msg: 'Admin user\'s associated school not found.' });
        }

        const students = await User.find({
            school: adminSchoolId,
            role: 'student',
            isApproved: true
        }).select('username yearGroup gameData displayName firstName lastName');
        const studentIds = students.map(s => s._id);

        const stats = {
            registeredStudents: students.length,
            totalBadges: 0,
            totalCertificates: 0,
            studentsWithBadges: 0,
            studentsWithCertificates: 0,
            totalGameAttempts: 0, // <-- This will be updated
            topPerformers: [],
        };

        const gamePlayCounts = {};

        for (const student of students) {
            let studentTotalBadges = 0;
            let studentTotalCertificates = 0;
            let studentScore = 0;
            let hasBadge = false;
            let studentAttempts = 0; // <-- This will be updated

            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    const gameBadges = progress.badges ? progress.badges.size : 0;
                    studentTotalBadges += gameBadges;
                    if (gameBadges > 0) hasBadge = true;

                    const gameCertificates = progress.certificates ? progress.certificates.size : 0;
                    studentTotalCertificates += gameCertificates;
                    
                    if (progress.highScores) {
                        progress.highScores.forEach(score => studentScore += score);
                    }
                    
                    // Use the new totalAttempts field
                    studentAttempts += progress.totalAttempts || 0;
                    
                    gamePlayCounts[gameId] = (gamePlayCounts[gameId] || 0) + (progress.totalAttempts || 0);
                });
            }

            if (hasBadge) stats.studentsWithBadges++;
            stats.totalBadges += studentTotalBadges;
            stats.totalCertificates += studentTotalCertificates;
            if (studentTotalCertificates > 0) stats.studentsWithCertificates++;

            stats.totalGameAttempts += studentAttempts;

            stats.topPerformers.push({
                _id: student._id,
                name: student.displayName || `${student.firstName} ${student.lastName}`.trim(),
                yearGroup: student.yearGroup,
                certificates: studentTotalCertificates,
                badges: studentTotalBadges,
                score: studentScore
            });
        }
        
        stats.topPerformers.sort((a, b) => b.score - a.score);
        stats.topPerformers = stats.topPerformers.slice(0, 5);

        const favoriteGames = await Game.aggregate([
            { $unwind: '$ratings' },
            { $match: { 'ratings.user': { $in: studentIds } } },
            { 
                $group: {
                    _id: '$_id',
                    title: { $first: '$title' },
                    averageRating: { $avg: '$ratings.rating' },
                    numRatings: { $sum: 1 }
                }
            },
            { $sort: { averageRating: -1 } },
            { $limit: 4 }
        ]);

        const allGames = await Game.find({}).select('title imageUrl');
        const gameMap = new Map();
        allGames.forEach(game => {
            const gameInfo = { title: game.title, imageUrl: game.imageUrl };
            gameMap.set(game._id.toString(), gameInfo);
            if (game.title === 'Data Forge') gameMap.set('data-forge', gameInfo);
            if (game.title === 'Network Shield') gameMap.set('cyber-security', gameInfo);
        });

        const topPlayedGames = Object.entries(gamePlayCounts)
            .map(([gameId, count]) => {
                const gameInfo = gameMap.get(gameId) || { title: 'Unknown Game', imageUrl: null };
                return {
                    title: gameInfo.title,
                    imageUrl: gameInfo.imageUrl,
                    students: count // This now represents total plays, not unique students
                };
            })
            .sort((a, b) => b.students - a.students)
            .slice(0, 4);

        res.json({
            schoolName: school.name,
            stats,
            favoriteGames,
            topPlayedGames
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- THIS IS THE FIX: Added rating calculation ---
exports.getSchoolGameProgress = async (req, res) => {
    try {
        const adminSchoolId = req.user.school;

        const students = await User.find({ school: adminSchoolId, role: 'student' }).select('_id gameData');
        const studentIds = new Set(students.map(s => s._id.toString()));

        const allGames = await Game.find({}).select('title category imageUrl ratings');
        
        const gameStatsMap = new Map();
        const idTranslationMap = new Map();

        allGames.forEach(game => {
            const gameIdStr = game._id.toString();
            const schoolRatings = game.ratings.filter(r => studentIds.has(r.user.toString()));
            let averageSchoolRating = 0;
            if (schoolRatings.length > 0) {
                const total = schoolRatings.reduce((acc, r) => acc + r.rating, 0);
                averageSchoolRating = total / schoolRatings.length;
            }

            gameStatsMap.set(gameIdStr, {
                _id: game._id,
                title: game.title,
                category: game.category,
                imageUrl: game.imageUrl,
                badges: 0,
                attempts: 0, // <-- This will be updated
                certificates: 0,
                averageRating: averageSchoolRating.toFixed(1),
            });

            idTranslationMap.set(gameIdStr, gameIdStr);
            if (game.title === 'Data Forge') idTranslationMap.set('data-forge', gameIdStr);
            if (game.title === 'Network Shield') idTranslationMap.set('cyber-security', gameIdStr);
        });

        for (const student of students) {
            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    const correctGameId = idTranslationMap.get(gameId);
                    if (correctGameId && gameStatsMap.has(correctGameId)) {
                        const stats = gameStatsMap.get(correctGameId);
                        stats.badges += progress.badges ? progress.badges.size : 0;
                        stats.certificates += progress.certificates ? progress.certificates.size : 0;
                        // Use the new totalAttempts field
                        stats.attempts += progress.totalAttempts || 0;
                    }
                });
            }
        }

        const results = Array.from(gameStatsMap.values());
        res.json(results);

    } catch (err) {
        console.error("School Game Progress Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
};