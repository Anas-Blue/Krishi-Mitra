require('dotenv').config();
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
    await mongoose.connect(MONGO_URI);
    console.log('[db] Connected to MongoDB Atlas');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[server] Running on port ${PORT}`);
    });

    startScheduler();
  } catch (err) {
    console.error('[startup] Fatal error:', err.message);
    process.exit(1);
  }
}

start();
