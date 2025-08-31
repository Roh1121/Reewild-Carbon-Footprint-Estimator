import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import estimateRoutes from './routes/estimate';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://foodprint.reewild.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', estimateRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Carbon Foodprint Estimator API',
    version: '1.0.0',
    description: 'Backend API for estimating carbon footprint of dishes',
    endpoints: {
      'POST /api/estimate': 'Estimate carbon footprint from dish name',
      'POST /api/estimate/image': 'Estimate carbon footprint from image',
      'POST /api/estimate/batch': 'Batch estimate multiple dishes',
      'GET /api/health': 'Health check',
      'GET /api/carbon-data/stats': 'Carbon data statistics'
    },
    documentation: 'See README.md for detailed usage instructions',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Carbon Foodprint Estimator API running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set. AI features will not work.');
  }
});

export default app;