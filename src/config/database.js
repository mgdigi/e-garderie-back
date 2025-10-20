import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/e-garderie');

    console.log(`MongoDB connecté: ${conn.connection.host}`);

    const { createDefaultSuperAdmin, createDefaultCrecheAndAdmin } = await import('../controllers/authController.js');
    await createDefaultSuperAdmin();
    await createDefaultCrecheAndAdmin();
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;