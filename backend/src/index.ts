import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { projectsRouter } from './routes/projects.js';
import { simulateRouter } from './routes/simulate.js';
import { diagramRouter } from './routes/diagram.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    service: 'RTL Portfolio Simulation & Schematic Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects', simulateRouter);
app.use('/api/projects', diagramRouter);

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  SiliconForge RTL Portfolio Backend API Running      `);
  console.log(`  Port: ${PORT}                                       `);
  console.log(`  Health Check: http://localhost:${PORT}/api/health   `);
  console.log(`=======================================================`);
});
