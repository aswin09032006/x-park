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
        }).select('username yearGroup gameData');
        const studentIds = students.map(s => s._id);

        const stats = {
            registeredStudents: students.length,
            totalBadges: 0,
            totalCertificates: 0,
            studentsWithBadges: 0,
            studentsWithCertificates: 0,
            totalGameAttempts: 0,
            topPerformers: [],
        };

        const gamePlayCounts = {};

        for (const student of students) {
            let studentBadges = 0;
            let studentScore = 0;
            let hasBadge = false;

            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    const gameBadges = progress.badges ? progress.badges.size : 0;
                    studentBadges += gameBadges;
                    if (gameBadges > 0) hasBadge = true;
                    
                    if (progress.highScores) {
                        progress.highScores.forEach(score => studentScore += score);
                    }
                    
                    gamePlayCounts[gameId] = (gamePlayCounts[gameId] || 0) + 1;
                });
            }

            if (hasBadge) stats.studentsWithBadges++;
            stats.totalBadges += studentBadges;
            const studentCertificates = Math.floor(studentBadges / 3);
            stats.totalCertificates += studentCertificates;
            if (studentCertificates > 0) stats.studentsWithCertificates++;
            stats.totalGameAttempts += studentScore;

            stats.topPerformers.push({
                _id: student._id,
                name: student.username,
                yearGroup: student.yearGroup,
                certificates: studentCertificates,
                badges: studentBadges,
                score: studentScore
            });
        }
        
        stats.topPerformers.sort((a, b) => b.score - a.score);
        stats.topPerformers = stats.topPerformers.slice(0, 5);

        // --- UPDATED: Calculate Favorite Games based on this school's students ---
        const favoriteGames = await Game.aggregate([
            { $unwind: '$ratings' },
            { $match: { 'ratings.user': { $in: studentIds } } },
            { 
                $group: {
                    _id: '$_id',
                    title: { $first: '$title' },
                    averageRating: { $avg: '$ratings.rating' }
                }
            },
            { $sort: { averageRating: -1 } },
            { $limit: 4 }
        ]);

        const allGames = await Game.find({}).select('title');
        const gameIdToTitleMap = allGames.reduce((acc, game) => {
            acc[game._id.toString()] = game.title;
            return acc;
        }, {});

        const topPlayedGames = Object.entries(gamePlayCounts)
            .map(([gameId, count]) => ({
                title: gameIdToTitleMap[gameId] || 'Unknown Game',
                students: count
            }))
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



// --- THIS IS THE FIX ---
// @desc    Get aggregated game progress for a school admin's school
// @route   GET /api/dashboard/school-game-progress
// @access  Private (School Admin)
exports.getSchoolGameProgress = async (req, res) => {
    try {
        const adminSchoolId = req.user.school;

        // 1. Fetch ALL games first to create a baseline
        const allGames = await Game.find({}).select('title category imageUrl');
        const gameStatsMap = new Map();

        // 2. Initialize stats for every game to 0
        allGames.forEach(game => {
            gameStatsMap.set(game._id.toString(), {
                _id: game._id,
                title: game.title,
                category: game.category,
                imageUrl: game.imageUrl,
                badges: 0,
                attempts: 0,
                certificates: 0,
            });
        });

        // 3. Get all students for the school
        const students = await User.find({
            school: adminSchoolId,
            role: 'student',
            isApproved: true
        }).select('gameData');

        // 4. Loop through students and aggregate their data into the map
        for (const student of students) {
            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    // Only update if the game exists in our map
                    if (gameStatsMap.has(gameId)) {
                        const stats = gameStatsMap.get(gameId);
                        stats.badges += progress.badges ? progress.badges.size : 0;
                        if (progress.highScores) {
                            progress.highScores.forEach(score => stats.attempts += score);
                        }
                    }
                });
            }
        }

        // 5. Convert map values to an array and calculate certificates
        const results = Array.from(gameStatsMap.values()).map(game => {
            game.certificates = Math.floor(game.badges / 3); // Example logic
            return game;
        });

        res.json(results);

    } catch (err) {
        console.error("School Game Progress Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
};