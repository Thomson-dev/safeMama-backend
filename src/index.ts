import express, { Request, Response } from 'express';
import dotenv from "dotenv";
import connectDB from "./config/db";
import clinicRoutes from "./routes/clinicRoutes";
import userRoutes from "./routes/userRoutes";
import visitRoutes from "./routes/visitRoutes";

import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 1000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/visits", visitRoutes);
// app.use("/api/payments", paymentRoutes); // Uncomment if you have payment routes

// Test Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World from Express.js with TypeScript!' });
});

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ 
    message: 'Hello from API endpoint!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Database connection test endpoint
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({
      success: true,
      database: {
        state: states[dbState],
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Start server function
const startServer = async () => {
  try {
    console.log('🔄 Connecting to database...');
    
    // Wait for database connection BEFORE starting server
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Start server only after database is connected
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   GET / - Hello World message`);
      console.log(`   GET /api/hello - API endpoint with details`);
      console.log(`   GET /health - Health check endpoint`);
      console.log(`   GET /api/db-status - Database connection status`);
      console.log(`   POST /api/users/register - Register user`);
      console.log(`   POST /api/users/login - Login user`);
      console.log(`   POST /api/clinics - Create clinic`);
      console.log(`   GET /api/clinics - Get all clinics`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default app;