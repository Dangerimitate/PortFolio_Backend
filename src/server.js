const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

let server;

const startServer = async () => {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Seed default SuperAdmin and test accounts
    await seedAdmin();

    // 3. Start Express HTTP server
    const PORT = config.port;
    server = app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
