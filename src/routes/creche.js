import express from 'express';
import {
  getCreche,
  updateCreche,
  getCrecheStats,
  getCrecheUsers,
  createCrecheUser,
  updateCrecheUser,
  deleteCrecheUser
} from '../controllers/crecheController.js';
import { authenticate, authorize, checkCrecheAccess } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les crèches
router.get('/:id', checkCrecheAccess, getCreche);
router.put('/:id', checkCrecheAccess, authorize('DIRECTRICE'), updateCreche);
router.get('/:id/stats', checkCrecheAccess, getCrecheStats);

// Routes pour la gestion des utilisateurs (DIRECTRICE seulement)
router.get('/:id/users', checkCrecheAccess, authorize('DIRECTRICE'), getCrecheUsers);
router.post('/:id/users', checkCrecheAccess, authorize('DIRECTRICE'), createCrecheUser);
router.put('/:id/users/:userId', checkCrecheAccess, authorize('DIRECTRICE'), updateCrecheUser);
router.delete('/:id/users/:userId', checkCrecheAccess, authorize('DIRECTRICE'), deleteCrecheUser);

export default router;