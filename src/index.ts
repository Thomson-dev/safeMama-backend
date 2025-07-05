import express, { Request, Response } from 'express';
import dotenv from "dotenv";
import connectDB from "./config/db";
import clinicRoutes from "./routes/clinicRoutes";
import userRoutes from "./routes/userRoutes";
import visitRoutes from "./routes/visitRoutes";
import cors from 'cors';





// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 1000;



app.use(cors());


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

app.use("/api/users", userRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/visits", visitRoutes);


// Routes
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   GET / - Hello World message`);
  console.log(`   GET /api/hello - API endpoint with details`);
  console.log(`   GET /health - Health check endpoint`);
});

