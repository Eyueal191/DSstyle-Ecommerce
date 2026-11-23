import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Db_for_e-commerce";
        const conn = await mongoose.connect(mongoUri, {
            connectTimeoutMS: 50000, // Wait up to 50 seconds
            serverSelectionTimeoutMS: 50000 // Server selection timeout
        });

        console.log(`✅ DB has Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
        process.exit(1); // Stop the app if DB connection fails
    }
};

export default connectDB;
