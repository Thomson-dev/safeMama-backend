import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('MONGO_URI environment variable is not set');
      process.exit(1);
    }

    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // MongoDB Driver Options (for mongoose.connect)
    const mongoOptions = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,          // 45 seconds
      connectTimeoutMS: 30000,         // 30 seconds
      maxPoolSize: 10,                 // Maximum connections
      retryWrites: true,
      w: "majority" as const
    };

    // Mongoose-specific settings
    mongoose.set('bufferCommands', false);
    // mongoose.set('bufferMaxEntries', 0); // Removed: not supported in recent Mongoose versions

    await mongoose.connect(mongoURI, mongoOptions);
    console.log('✅ MongoDB Connected Successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose disconnected from MongoDB');
});

export default connectDB;