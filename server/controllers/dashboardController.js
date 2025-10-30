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
            let studentTotalBadges = 0; // <-- FIX: Use a new variable for the student's total
            let studentScore = 0;
            let hasBadge = false;
            let studentAttempts = 0;

            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    const gameBadges = progress.badges ? progress.badges.size : 0;
                    studentTotalBadges += gameBadges; // <-- FIX: Aggregate all badges for the student
                    if (gameBadges > 0) hasBadge = true;
                    
                    if (progress.highScores) {
                        progress.highScores.forEach(score => studentScore += score);
                    }
                    
                    if (progress.completedLevels) {
                        studentAttempts += progress.completedLevels.size;
                    }
                    
                    gamePlayCounts[gameId] = (gamePlayCounts[gameId] || 0) + 1;
                });
            }

            if (hasBadge) stats.studentsWithBadges++;
            stats.totalBadges += studentTotalBadges; // Add student's total to the grand total
            
            // --- THIS IS THE FIX ---
            // Calculate certificates based on the student's total badges across all games.
            const studentTotalCertificates = Math.floor(studentTotalBadges / 3);
            stats.totalCertificates += studentTotalCertificates;
            
            if (studentTotalCertificates > 0) stats.studentsWithCertificates++;
            stats.totalGameAttempts += studentAttempts;

            stats.topPerformers.push({
                _id: student._id,
                name: student.username,
                yearGroup: student.yearGroup,
                certificates: studentTotalCertificates, // <-- FIX: Use the correct total
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
            
            if (game.title === 'Data Forge') {
                gameMap.set('data-forge', gameInfo);
            }
            if (game.title === 'Network Shield') {
                gameMap.set('cyber-security', gameInfo);
            }
        });

        const topPlayedGames = Object.entries(gamePlayCounts)
            .map(([gameId, count]) => {
                const gameInfo = gameMap.get(gameId) || { title: 'Unknown Game', imageUrl: null };
                return {
                    title: gameInfo.title,
                    imageUrl: gameInfo.imageUrl,
                    students: count
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



// @desc    Get aggregated game progress for a school admin's school
// @route   GET /api/dashboard/school-game-progress
// @access  Private (School Admin)
exports.getSchoolGameProgress = async (req, res) => {
    try {
        const adminSchoolId = req.user.school;

        const allGames = await Game.find({}).select('title category imageUrl');
        
        const gameStatsMap = new Map();
        const idTranslationMap = new Map();

        allGames.forEach(game => {
            const gameIdStr = game._id.toString();
            gameStatsMap.set(gameIdStr, {
                _id: game._id,
                title: game.title,
                category: game.category,
                imageUrl: game.imageUrl,
                badges: 0,
                attempts: 0,
                certificates: 0,
            });

            idTranslationMap.set(gameIdStr, gameIdStr);
            if (game.title === 'Data Forge') {
                idTranslationMap.set('data-forge', gameIdStr);
            }
            if (game.title === 'Network Shield') {
                idTranslationMap.set('cyber-security', gameIdStr);
            }
        });

        const students = await User.find({
            school: adminSchoolId,
            role: 'student',
            isApproved: true
        }).select('gameData');

        for (const student of students) {
            if (student.gameData && student.gameData.size > 0) {
                student.gameData.forEach((progress, gameId) => {
                    const correctGameId = idTranslationMap.get(gameId);

                    if (correctGameId && gameStatsMap.has(correctGameId)) {
                        const stats = gameStatsMap.get(correctGameId);
                        stats.badges += progress.badges ? progress.badges.size : 0;
                        
                        if (progress.completedLevels) {
                            stats.attempts += progress.completedLevels.size;
                        }
                    }
                });
            }
        }

        const results = Array.from(gameStatsMap.values()).map(game => {
            game.certificates = Math.floor(game.badges / 3);
            return game;
        });

        res.json(results);

    } catch (err) {
        console.error("School Game Progress Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
};