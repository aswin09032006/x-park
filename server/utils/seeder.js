// --- /backend/seeder.js ---
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const School = require('./models/School');
const User = require('./models/User');

dotenv.config();

const connect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const schools = [
    { name: 'Northwood High School' },
    { name: 'Riverdale Academy' },
    { name: 'Maple Creek Secondary' },
    { name: 'Westwood Preparatory' }
];

const importData = async () => {
    try {
        await connect();
        console.log('Clearing old data...');
        await School.deleteMany();
        await User.deleteOne({ email: process.env.ADMIN_EMAIL });
        await User.deleteOne({ email: process.env.SUPERADMIN_EMAIL });

        console.log('Seeding schools...');
        const createdSchools = await School.insertMany(schools);
        console.log('Schools seeded successfully.');

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            console.error('Error: Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.');
            process.exit(1);
        }
        console.log('Creating default school admin user...');
        const firstSchoolId = createdSchools[0]._id;
        await User.create({
            username: 'schooladmin', email: adminEmail, password: adminPassword,
            role: 'schooladmin', school: firstSchoolId,
            isVerified: true, isApproved: true, fullName: 'School Admin User',
        });
        console.log('Default school admin user created.');

        const superAdminEmail = process.env.SUPERADMIN_EMAIL;
        const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
        if (!superAdminEmail || !superAdminPassword) {
            console.error('Error: Please set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in your .env file.');
            process.exit(1);
        }
        console.log('Creating default super admin user...');
        await User.create({
            username: 'superadmin', email: superAdminEmail, password: superAdminPassword,
            role: 'superadmin',
            isVerified: true, isApproved: true, fullName: 'Super Admin User',
        });
        console.log('Default super admin user created.');
        
        console.log('------------------------------------------');
        console.log(`Super Admin Email: ${superAdminEmail}`);
        console.log(`Super Admin Password: ${superAdminPassword}`);
        console.log('------------------------------------------');
        console.log(`School Admin Email: ${adminEmail}`);
        console.log(`School Admin Password: ${adminPassword}`);
        console.log('------------------------------------------');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connect();
        console.log('Destroying all school and admin data...');
        await School.deleteMany();
        await User.deleteMany({ role: 'admin' });
        await User.deleteMany({ role: 'superadmin' });
        
        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}