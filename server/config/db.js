const mongoose = require('mongoose');
const School = require('../models/School');
const User = require('../models/User');
const Game = require('../models/Game');

// --- Seeding Logic Function ---
const seedDatabase = async () => {
    try {
        // 1. Seed Schools (if necessary)
        const schoolCount = await School.countDocuments();
        let createdSchools = await School.find(); // Load existing schools for user seeding later

        if (schoolCount === 0) {
            console.log('No schools found. Seeding initial schools...');
            const initialSchools = [
                { name: 'Northwood High School' },
                { name: 'Riverdale Academy' },
                { name: 'Maple Creek Secondary' },
                { name: 'Westwood Preparatory' }
            ];

            // --- THE FIX IS HERE: Use Promise.all with School.create() to force pre-save hooks ---
            createdSchools = await Promise.all(
                initialSchools.map(schoolData => School.create(schoolData))
            );
            console.log('Database seeded with initial schools.');
        } else {
            console.log('School data already exists. Skipping school seed.');
        }

        // 2. Seed Games (if necessary)
        const gameCount = await Game.countDocuments();
        if (gameCount === 0) {
            console.log('No games found. Seeding initial games...');
            const initialGames = [
                {
                    title: "Network Shield",
                    description: "Step into the world of Cybersecurity. Take on real-world roles, battle threats, and protect digital systems in our flagship game, Network Shield. Students explore network security roles through 10 fast-paced mini-games that challenge their problem-solving, memory, and critical thinking.",
                    category: "Cybersecurity",
                    imageUrl: "/network-shield.jpg",
                    gameUrl: "/games/cyber-security",
                    isComingSoon: false,
                    sponsor: "Metamorphs"
                },
                {
                    title: "Malware Hunters",
                    description: "Explore the career of a Cyber Threat Intelligence Analyst. Identify, investigate, and neutralize cyber threats in this upcoming experience that blends logic puzzles with real-time threat analysis.",
                    category: "Cybersecurity", 
                    imageUrl: "/malware-hunters.jpg",   
                    gameUrl: null,                    
                    isComingSoon: true,
                    sponsor: "Metamorphs"
                },
                {
                    title: "Data Forge",
                    description: "Enter the world of Data Science. Clean and organise messy datasets, build prediction models using basic machine learning, and uncover hidden trends while stepping into the shoes of a real-life data scientist.",
                    category: "Artificial Intelligence", 
                    imageUrl: "/data-forge.jpg",         
                    gameUrl: "/games/data-forge",                      
                    isComingSoon: false,
                    sponsor: "Metamorphs"
                }
            ];
            await Game.insertMany(initialGames);
            console.log('Database seeded with initial games.');
        } else {
            console.log('Game data already exists. Skipping game seed.');
        }


        // 3. Seed Users (if necessary)
        const superAdminEmail = process.env.SUPERADMIN_EMAIL;
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!superAdminEmail || !adminEmail) {
            console.error('CRITICAL: SUPERADMIN_EMAIL and ADMIN_EMAIL must be set in .env to ensure initial users can be created.');
            return;
        }

        const superAdminExists = await User.findOne({ role: 'superadmin' });
        if (!superAdminExists) {
            console.log('No Super Admin found. Creating default super admin...');
            await User.create({
                username: 'superadmin', email: superAdminEmail, password: process.env.SUPERADMIN_PASSWORD,
                role: 'superadmin', isVerified: true, isApproved: true, fullName: 'Super Admin User',
            });
            console.log('Default super admin user created.');
        } else {
            console.log('Super admin already exists. Skipping super admin seed.');
        }

        const schoolAdminExists = await User.findOne({ email: adminEmail });
        if (!schoolAdminExists) {
            console.log('No School Admin found for the default email. Creating default school admin...');
            const firstSchool = createdSchools.length > 0 ? createdSchools[0] : await School.findOne();
            
            if (firstSchool) {
                await User.create({
                    username: 'schooladmin', email: adminEmail, password: process.env.ADMIN_PASSWORD,
                    role: 'schooladmin', school: firstSchool._id,
                    isVerified: true, isApproved: true, fullName: 'School Admin User',
                });
                console.log('Default school admin user created.');
            } else {
                console.error('Could not create default school admin because no schools were found in the database.');
            }
        } else {
            console.log('Default school admin already exists. Skipping school admin seed.');
        }

    } catch (error) {
        console.error('Error during automatic database seeding:', error);
    }
}


const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        await seedDatabase();

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;