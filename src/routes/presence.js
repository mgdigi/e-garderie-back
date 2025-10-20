import express from 'express';
import {
  getPresences,
  marquerPresence,
  updatePresence,
  getStatsPresence,
  deletePresence,
  sendParentNotification
} from '../controllers/presenceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes présences
router.get('/', getPresences);
router.post('/', marquerPresence);
router.put('/:id', updatePresence);
router.get('/stats', getStatsPresence);
router.delete('/:id', deletePresence);

// Route pour envoyer les notifications aux parents
router.post('/send-notification', sendParentNotification);

export default router;