const mongoose = require('mongoose');
const School = require('../models/School');
const User = require('../models/User');
const Game = require('../models/Game');
const { backendLogger } = require('./logger');

const seedDatabase = async () => {
    const context = 'db.seedDatabase';
    try {
        const schoolCount = await School.countDocuments();
        let createdSchools = await School.find(); 

        if (schoolCount === 0) {
            backendLogger.info('No schools found. Seeding initial schools...', { context });
            const initialSchools = [
                { name: 'Northwood High School' }, { name: 'Riverdale Academy' },
                { name: 'Maple Creek Secondary' }, { name: 'Westwood Preparatory' }
            ];
            createdSchools = await Promise.all(initialSchools.map(schoolData => School.create(schoolData)));
            backendLogger.success('Database seeded with initial schools.', { context });
        } else {
            backendLogger.info('School data already exists. Skipping school seed.', { context });
        }

        const gameCount = await Game.countDocuments();
        if (gameCount === 0) {
            backendLogger.info('No games found. Seeding initial games...', { context });
            const initialGames = [
                { title: "Network Shield", description: "Step into the world of Cybersecurity. Take on real-world roles, battle threats, and protect digital systems in our flagship game, Network Shield. Students explore network security roles through 10 fast-paced mini-games that challenge their problem-solving, memory, and critical thinking.", category: "Cybersecurity", imageUrl: "/network-shield.jpg", gameUrl: "/games/cyber-security", isComingSoon: false, sponsor: "Metamorphs" },
                { title: "Malware Hunters", description: "Explore the career of a Cyber Threat Intelligence Analyst. Identify, investigate, and neutralize cyber threats in this upcoming experience that blends logic puzzles with real-time threat analysis.", category: "Cybersecurity", imageUrl: "/malware-hunters.jpg", gameUrl: null, isComingSoon: true, sponsor: "Metamorphs" },
                { title: "Data Forge", description: "Enter the world of Data Science. Clean and organise messy datasets, build prediction models using basic machine learning, and uncover hidden trends while stepping into the shoes of a real-life data scientist.", category: "Artificial Intelligence", imageUrl: "/data-forge.jpg", gameUrl: "/games/data-forge", isComingSoon: false, sponsor: "Metamorphs" }
            ];
            await Game.insertMany(initialGames);
            backendLogger.success('Database seeded with initial games.', { context });
        } else {
            backendLogger.info('Game data already exists. Skipping game seed.', { context });
        }

        const superAdminEmail = process.env.SUPERADMIN_EMAIL;
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!superAdminEmail || !adminEmail) {
            backendLogger.error('CRITICAL: SUPERADMIN_EMAIL and ADMIN_EMAIL must be set in .env to seed initial users.', { context });
            return;
        }

        if (!(await User.findOne({ role: 'superadmin' }))) {
            backendLogger.info('No Super Admin found. Creating default super admin...', { context });
            await User.create({ username: 'superadmin', email: superAdminEmail, password: process.env.SUPERADMIN_PASSWORD, role: 'superadmin', isVerified: true, isApproved: true, fullName: 'Super Admin User' });
            backendLogger.success('Default super admin user created.', { context });
        } else {
            backendLogger.info('Super admin already exists. Skipping super admin seed.', { context });
        }

        if (!(await User.findOne({ email: adminEmail }))) {
            backendLogger.info('No School Admin found for the default email. Creating default school admin...', { context });
            const firstSchool = createdSchools.length > 0 ? createdSchools[0] : await School.findOne();
            if (firstSchool) {
                await User.create({ username: 'schooladmin', email: adminEmail, password: process.env.ADMIN_PASSWORD, role: 'schooladmin', school: firstSchool._id, isVerified: true, isApproved: true, fullName: 'School Admin User' });
                backendLogger.success('Default school admin user created.', { context });
            } else {
                backendLogger.error('Could not create default school admin because no schools were found in the database.', { context });
            }
        } else {
            backendLogger.info('Default school admin already exists. Skipping school admin seed.', { context });
        }

    } catch (error) {
        backendLogger.error('Error during automatic database seeding.', { context, details: { error: error.message, stack: error.stack } });
    }
}

const connectDB = async () => {
    const context = 'db.connectDB';
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        backendLogger.success(`MongoDB Connected: ${conn.connection.host}`, { context });
        await seedDatabase();
    } catch (error) {
        backendLogger.error(`Error connecting to MongoDB: ${error.message}`, { context, details: { stack: error.stack } });
        process.exit(1);
    }
};

module.exports = connectDB;