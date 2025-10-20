import express from 'express';
import {
  getFactures,
  createFacture,
  validatePaiement
} from '../controllers/factureController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes factures
router.get('/', getFactures);
router.post('/', createFacture);
router.post('/:id/validate', validatePaiement);

export default router;