require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (_) {}

const mongoose = require('mongoose');
const createApp = require('./app');
const { startScheduler } = require('./services/schedulerService');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL: MONGO_URI environment variable is not set');
  process.exit(1);
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] Connected to MongoDB Atlas');
    startScheduler();
  } catch (err) {
    console.warn('[db] Could not connect to MongoDB Atlas (', err.message, '). Server starting in local fallback mode.');
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}`);
  });
}

start();

