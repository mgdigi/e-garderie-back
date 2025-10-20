import express from 'express';
import {
  getEnfantsReport,
  getPresenceReport,
  getFinancialReport,
  getPersonnelReport,
  getGeneralStats
} from '../controllers/rapportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes des rapports
router.get('/enfants', getEnfantsReport);
router.get('/presence', getPresenceReport);
router.get('/financier', getFinancialReport);
router.get('/personnel', getPersonnelReport);
router.get('/statistiques-generales', getGeneralStats);

export default router;