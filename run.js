import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the server
const server = spawn('node', ['--loader', 'tsx/esm', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit'
});

// Start the client
const client = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  cwd: __dirname,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});

console.log('Starting ChessLana development server...');