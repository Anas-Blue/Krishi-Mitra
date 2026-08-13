const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');
const { errorResponse } = require('./utils/response');

function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'krishi-server' }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/fields', fieldRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/admin', adminRoutes);

  // 404
  app.use((req, res) => errorResponse(res, `Route ${req.method} ${req.path} not found`, 404));

  // Global error handler
  app.use((err, req, res, _next) => {
    console.error('[error]', err.message);
    errorResponse(res, err.message || 'Internal server error', err.status || 500);
  });

  return app;
}

module.exports = createApp;
