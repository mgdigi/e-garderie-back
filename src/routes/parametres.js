import express from 'express';
import {
  getParametres,
  updateParametresCreche,
  createClasse,
  updateClasse,
  deleteClasse,
  getClasses
} from '../controllers/parametresController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les paramètres généraux
router.get('/', getParametres);
router.put('/creche', updateParametresCreche);

// Routes pour les classes
router.get('/classes', getClasses);
router.post('/classes', createClasse);
router.put('/classes/:id', updateClasse);
router.delete('/classes/:id', deleteClasse);

export default router;