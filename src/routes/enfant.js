import express from 'express';
import {
  getEnfants,
  getEnfant,
  createEnfant,
  updateEnfant,
  deleteEnfant
} from '../controllers/enfantController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes enfants
router.get('/', getEnfants);
router.post('/', createEnfant);
router.get('/:id', getEnfant);
router.put('/:id', updateEnfant);
router.delete('/:id', deleteEnfant);

export default router;