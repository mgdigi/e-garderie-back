import express from 'express';
import {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  payerSalaire,
  getHistoriqueSalaires
} from '../controllers/personnelController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes personnel
router.get('/', getPersonnel);
router.post('/', createPersonnel);
router.get('/:id', getPersonnelById);
router.put('/:id', updatePersonnel);
router.post('/:id/payer-salaire', payerSalaire);
router.get('/:id/salaires', getHistoriqueSalaires);
router.delete('/:id', deletePersonnel);

export default router;