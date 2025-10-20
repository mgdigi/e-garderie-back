import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import des routes
import authRoutes from './routes/auth.js';
import crecheRoutes from './routes/creche.js';
import enfantRoutes from './routes/enfant.js';
import personnelRoutes from './routes/personnel.js';
import presenceRoutes from './routes/presence.js';
import paiementRoutes from './routes/paiement.js';
import emploiDuTempsRoutes from './routes/emploiDuTemps.js';
import menuRoutes from './routes/menu.js';
import factureRoutes from './routes/facture.js';
import dashboardRoutes from './routes/dashboard.js';
import rapportRoutes from './routes/rapports.js';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Connexion à la base de données
connectDB();

// Middlewares
const corsOptions = {
  origin: 'https://e-garderie-m0ibojkyf-gueyes-projects.vercel.app', // URL de votre frontend
  credentials: true, // Permet l'envoi de credentials (cookies, headers d'auth)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'] // Headers autorisés
};

// Remplacer la ligne existante app.use(cors())
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (PDFs)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/creches', crecheRoutes);
app.use('/api/enfants', enfantRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/emplois-du-temps', emploiDuTempsRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rapports', rapportRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🏫 API E-Garderie - Serveur en fonctionnement !',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Erreur de validation Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
  
  // Erreur de duplication (clé unique)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} existe déjà`
    });
  }
  
  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  // Erreur par défaut
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur E-Garderie démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});

export default app;