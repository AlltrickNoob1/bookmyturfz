const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('Starting simple server...');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

console.log('About to listen on port', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});
