import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB connected ${conn.connection.host}`)
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error ${error.message}`);
    } else {
      console.log(`Error ${String(error)}`);
    }
  }
};

export default connectDB;