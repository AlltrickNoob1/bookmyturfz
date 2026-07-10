const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('[LOG] Starting server...');
console.log('[LOG] RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'MISSING');
console.log('[LOG] RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'MISSING');

const app = express();
const PORT = process.env.PORT || 5000;

try {
  console.log('[LOG] Loading payment routes...');
  const paymentRoutes = require('./routes/payment');
    console.log('[LOG] Loading email routes...');
    const emailRoutes = require('./routes/email');
    console.log('[LOG] Payment and email routes loaded successfully');

  // Middleware
  const allowedOrigins = [
    'https://bookmyturfz.up.railway.app',
    'https://bookmyturfz-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ];

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy violation'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.options('*', cors());
  app.use(express.json());

  // Routes
  app.use('/api/payment', paymentRoutes);
  app.use('/api/email', emailRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  // Start server
  console.log('[LOG] About to call app.listen()...');
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('[SUCCESS] Razorpay Payment Server running on http://localhost:' + PORT);
    console.log('[LOG] Payment API: POST http://localhost:' + PORT + '/api/payment/create-order');
    console.log('[LOG] Verify API: POST http://localhost:' + PORT + '/api/payment/verify-payment');
  });

  server.on('error', (err) => {
    console.error('[SERVER ERROR]', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error('[ERROR] Port ' + PORT + ' is already in use');
    }
    process.exit(1);
  });

  server.on('listening', () => {
    console.log('[LOG] Server event: listening');
  });

  console.log('[LOG] app.listen() returned');

} catch (error) {
  console.error('[FATAL ERROR]', error);
  process.exit(1);
}

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});
