const { spawn } = require('child_process');
const path = require('path');

// Start the server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

// Start the client after a short delay
setTimeout(() => {
  const client = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
    stdio: 'inherit'
  });

  client.on('error', (err) => {
    console.error('Client error:', err);
  });
}, 2000);

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill();
  process.exit();
});

console.log('Starting ChessLana - Decentralized Chess on Solana...');