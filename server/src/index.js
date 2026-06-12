import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());

// Logger
app.use(morgan('dev'));

// Routes
app.use('/api', authRouter);
app.use('/api/auth', authRouter);
// Also mount /api/user since routes are inside authRouter
app.use('/api/user', authRouter);
// Also mount /api/ai since chat routes are inside authRouter
app.use('/api/ai', authRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: 'connected', time: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error] Server exception:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Initialize DB and start server
async function startServer() {
  try {
    // Wait for SQLite initialization
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`[Server] NavGuide server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to initialize database and start server:', error);
    process.exit(1);
  }
}

startServer();
