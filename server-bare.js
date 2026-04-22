const http = require('http');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bare HTTP Server running on port ${PORT}`);
  console.log(`Test: curl http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
