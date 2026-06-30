const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('SUCCESS: Response received');
    console.log('Status:', res.statusCode);
    console.log('Data:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

req.end();
