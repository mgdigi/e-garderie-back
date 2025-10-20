import express from 'express';
import {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes du tableau de bord
router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/recent-activities', getRecentActivities);

export default router;