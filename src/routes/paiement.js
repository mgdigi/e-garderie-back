import express from 'express';
import paiementController from '../controllers/paiementController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes paiements
router.get('/', paiementController.getPaiements);
router.post('/', paiementController.createPaiement);
router.post('/mensualite-auto', paiementController.createPaiementMensualite);
router.get('/enfant/:enfantId', paiementController.getPaiementsEnfant);
router.get('/:id', paiementController.getPaiementById);
router.put('/:id', paiementController.updatePaiement);
router.put('/:id/valider', paiementController.validerPaiement);
router.get('/:id/recu', paiementController.genererRecuPDF);
router.delete('/:id', paiementController.deletePaiement);

export default router;