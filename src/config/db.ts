import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Skip reconnection if already connected
    if (mongoose.connection.readyState === 1) return;

    // Disconnect any hanging connections (optional in serverless)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // MongoDB Driver Options
    const mongoOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: "majority" as const
    };

    mongoose.set('bufferCommands', false);

    await mongoose.connect(mongoURI, mongoOptions);
    console.log('✅ MongoDB Connected Successfully');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error; // ⛔ Don't use process.exit in serverless!
  }
};

export default connectDB;
