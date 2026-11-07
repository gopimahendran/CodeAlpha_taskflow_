import mongoose from 'mongoose';

let mongoConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';
  try {
    mongoose.set('strictQuery', false);
    // Attempt connection with short timeout so server starts instantly without waiting minutes if local daemon isn't running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    mongoConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${uri}`);
    return true;
  } catch (err: any) {
    console.warn(`[Database] MongoDB connection failed (${err.message || 'not reachable'}). Running in persistent fallback JSON storage mode.`);
    mongoConnected = false;
    return false;
  }
};

export const isMongoConnected = (): boolean => mongoConnected;
