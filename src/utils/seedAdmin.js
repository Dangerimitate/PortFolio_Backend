const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // 1. Seed or find SuperAdmin
    const existingSuperAdmin = await User.findOne({
      $or: [{ username: 'superadmin' }, { email: 'superadmin@skar.com' }],
    });

    if (!existingSuperAdmin) {
      const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
      await User.create({
        name: 'Super Administrator',
        username: 'superadmin',
        email: 'superadmin@skar.com',
        number: '9999999999',
        password: superAdminPassword,
        role: 'superadmin',
      });
      console.log('👑 [MongoDB Seed] SuperAdmin account created: superadmin@skar.com / SuperAdmin@123');
    } else {
      console.log('👑 [MongoDB Seed] SuperAdmin account verified in MongoDB');
    }

    // 2. Seed default Rahul account for testing
    const existingUser = await User.findOne({
      $or: [{ number: '9876543210' }, { email: 'rahul@example.com' }],
    });

    if (!existingUser) {
      const userPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Rahul',
        email: 'rahul@example.com',
        number: '9876543210',
        password: userPassword,
        role: 'user',
      });
      console.log('👤 [MongoDB Seed] Default test user created: Rahul (9876543210 / rahul@example.com)');
    }
  } catch (error) {
    console.error('❌ [MongoDB Seed] Seeding error:', error.message);
  }
};

module.exports = seedAdmin;
