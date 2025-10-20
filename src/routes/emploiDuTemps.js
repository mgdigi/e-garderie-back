import express from 'express';
import {
  getEmploisDuTemps,
  getEmploiDuTempsById,
  createEmploiDuTemps,
  updateEmploiDuTemps,
  deleteEmploiDuTemps
} from '../controllers/emploiDuTempsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes emplois du temps
router.get('/', getEmploisDuTemps);
router.post('/', createEmploiDuTemps);
router.get('/:id', getEmploiDuTempsById);
router.put('/:id', updateEmploiDuTemps);
router.delete('/:id', deleteEmploiDuTemps);

export default router;