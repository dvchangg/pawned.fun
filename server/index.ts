import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', registerRoutes());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ChessLana API server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});