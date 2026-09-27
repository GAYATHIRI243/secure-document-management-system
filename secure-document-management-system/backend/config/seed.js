// Creates a default administrator account so you can log in immediately.
// Run with: npm run seed  (from the backend/ folder)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const email = 'admin@sdms.local';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: 'System Administrator',
      email,
      password: 'Admin@123',
      role: 'admin',
      status: 'active',
    });
    console.log('Default admin created:');
    console.log(`  email:    ${email}`);
    console.log('  password: Admin@123');
    console.log('Please change this password after first login.');
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
