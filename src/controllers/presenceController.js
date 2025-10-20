import Presence from '../models/Presence.js';
import Enfant from '../models/Enfant.js';
import mongoose from 'mongoose';

// @desc    Obtenir les présences pour une date donnée
// @route   GET /api/presences?date=YYYY-MM-DD
// @access  Private
export const getPresences = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { date, type, enfantId, personnelId } = req.query;

    let query = { crecheId };

    // Filtres
    if (date) query.date = new Date(date);
    if (type) query.type = type;
    if (enfantId) query.enfantId = enfantId;
    if (personnelId) query.personnelId = personnelId;

    const presences = await Presence.find(query)
      .populate('enfantId', 'nom prenom')
      .populate('personnelId', 'nom prenom')
      .populate('enregistrePar', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: presences,
      count: presences.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des présences',
      error: error.message
    });
  }
};

// @desc    Marquer une présence
// @route   POST /api/presences
// @access  Private
export const marquerPresence = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const userId = req.user._id;
    const { enfantId, personnelId, date, statut, heureArrivee, heureDepart, remarques } = req.body;

    // Validation des données
    if (!date || !statut) {
      return res.status(400).json({
        success: false,
        message: 'Date et statut requis'
      });
    }

    if (!enfantId && !personnelId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'enfant ou du personnel requis'
      });
    }

    // Déterminer le type
    const type = enfantId ? 'ENFANT' : 'PERSONNEL';

    // Vérifier si une présence existe déjà pour cette date
    const existingPresence = await Presence.findOne({
      crecheId,
      date: new Date(date),
      ...(enfantId && { enfantId }),
      ...(personnelId && { personnelId })
    });

    let presence;

    if (existingPresence) {
      // Mettre à jour la présence existante
      existingPresence.statut = statut;
      if (heureArrivee !== undefined) existingPresence.heureArrivee = heureArrivee;
      if (heureDepart !== undefined) existingPresence.heureDepart = heureDepart;
      if (remarques !== undefined) existingPresence.remarques = remarques;
      existingPresence.enregistrePar = userId;

      await existingPresence.save();
      presence = existingPresence;
    } else {
      // Créer une nouvelle présence
      presence = new Presence({
        crecheId,
        type,
        ...(enfantId && { enfantId }),
        ...(personnelId && { personnelId }),
        date: new Date(date),
        statut,
        ...(heureArrivee && { heureArrivee }),
        ...(heureDepart && { heureDepart }),
        remarques,
        enregistrePar: userId
      });

      await presence.save();
    }

    const presenceWithDetails = await Presence.findById(presence._id)
      .populate('enfantId', 'nom prenom')
      .populate('personnelId', 'nom prenom')
      .populate('enregistrePar', 'firstName lastName');

    // Envoyer notification SMS aux parents si c'est un enfant
    if (enfantId && (heureArrivee || heureDepart)) {
      try {
        await sendParentNotificationUtil(enfantId, heureArrivee ? 'arrival' : 'departure', heureArrivee || heureDepart);
      } catch (notificationError) {
        console.error('Erreur lors de l\'envoi de la notification:', notificationError);
        // Ne pas échouer la requête pour autant
      }
    }

    res.status(existingPresence ? 200 : 201).json({
      success: true,
      message: `Présence ${existingPresence ? 'mise à jour' : 'enregistrée'} avec succès`,
      data: presenceWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la présence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la présence',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques de présence
// @route   GET /api/presences/stats?date=YYYY-MM-DD
// @access  Private
export const getStatsPresence = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise'
      });
    }

    const targetDate = new Date(date);

    // Compter les présences pour cette date
    const stats = await Presence.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          date: targetDate
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            statut: '$statut'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Formater les résultats
    const result = {
      enfants: {
        total: 0,
        presents: 0,
        absents: 0
      },
      personnel: {
        total: 0,
        presents: 0,
        absents: 0
      }
    };

    stats.forEach(stat => {
      const { type, statut } = stat._id;
      const count = stat.count;

      if (type === 'ENFANT') {
        result.enfants.total += count;
        if (statut === 'PRESENT') result.enfants.presents += count;
        else result.enfants.absents += count;
      } else if (type === 'PERSONNEL') {
        result.personnel.total += count;
        if (statut === 'PRESENT') result.personnel.presents += count;
        else result.personnel.absents += count;
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une présence
// @route   PUT /api/presences/:id
// @access  Private
export const updatePresence = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const userId = req.user._id;
    const { enfantId, personnelId, date, statut, heureArrivee, heureDepart, remarques } = req.body;

    // Validation des données
    if (!date || !statut) {
      return res.status(400).json({
        success: false,
        message: 'Date et statut requis'
      });
    }

    if (!enfantId && !personnelId) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'enfant ou du personnel requis'
      });
    }

    // Vérifier si une présence existe déjà pour cette date
    const existingPresence = await Presence.findOne({
      crecheId,
      date: new Date(date),
      ...(enfantId && { enfantId }),
      ...(personnelId && { personnelId })
    });

    let presence;

    if (existingPresence) {
      // Mettre à jour la présence existante
      existingPresence.statut = statut;
      if (heureArrivee !== undefined) existingPresence.heureArrivee = heureArrivee;
      if (heureDepart !== undefined) existingPresence.heureDepart = heureDepart;
      if (remarques !== undefined) existingPresence.remarques = remarques;
      existingPresence.enregistrePar = userId;

      await existingPresence.save();
      presence = existingPresence;
    } else {
      // Créer une nouvelle présence si elle n'existe pas
      const type = enfantId ? 'ENFANT' : 'PERSONNEL';
      presence = new Presence({
        crecheId,
        type,
        ...(enfantId && { enfantId }),
        ...(personnelId && { personnelId }),
        date: new Date(date),
        statut,
        ...(heureArrivee && { heureArrivee }),
        ...(heureDepart && { heureDepart }),
        remarques,
        enregistrePar: userId
      });

      await presence.save();
    }

    const presenceWithDetails = await Presence.findById(presence._id)
      .populate('enfantId', 'nom prenom')
      .populate('personnelId', 'nom prenom')
      .populate('enregistrePar', 'firstName lastName');

    res.json({
      success: true,
      message: 'Présence mise à jour avec succès',
      data: presenceWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la présence',
      error: error.message
    });
  }
};

// @desc    Supprimer une présence
// @route   DELETE /api/presences/:id
// @access  Private
export const deletePresence = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const presence = await Presence.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Présence non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Présence supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la présence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la présence',
      error: error.message
    });
  }
};

// @desc    Envoyer une notification aux parents
// @route   POST /api/presences/send-notification
// @access  Private
export const sendParentNotification = async (req, res) => {
  try {
    const { enfantId, type, time } = req.body;

    if (!enfantId || !type || !time) {
      return res.status(400).json({
        success: false,
        message: 'enfantId, type et time sont requis'
      });
    }

    // Récupérer les informations de l'enfant et du parent
    const enfant = await Enfant.findById(enfantId).populate('parentId', 'nom prenom telephone');
    if (!enfant || !enfant.parentId || !enfant.parentId.telephone) {
      return res.status(404).json({
        success: false,
        message: 'Parent ou numéro de téléphone non trouvé pour cet enfant'
      });
    }

    // Créer le message personnalisé
    const parentName = `${enfant.parentId.nom} ${enfant.parentId.prenom}`;
    const childName = `${enfant.prenom} ${enfant.nom}`;
    const message = type === 'arrival'
      ? `Bonjour ${parentName}. Votre enfant ${childName} est arrivé(e) à la crèche à ${time}. Bonne journée !`
      : `Bonjour ${parentName}. Votre enfant ${childName} est parti(e) de la crèche à ${time}. Passez une bonne soirée !`;

    // TODO: Implémenter l'envoi réel de SMS via un service comme Twilio, Africa's Talking, etc.
    // Pour l'instant, on log le message
    console.log('SMS à envoyer:', {
      to: enfant.parentId.telephone,
      message: message,
      type: type,
      child: childName,
      time: time
    });

    // Simulation d'envoi réussi
    res.json({
      success: true,
      message: 'Notification envoyée avec succès',
      data: {
        enfantId,
        parentName,
        childName,
        type,
        time,
        telephone: enfant.parentId.telephone
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification',
      error: error.message
    });
  }
};

// Fonction utilitaire pour envoyer des notifications SMS aux parents (utilisée dans marquerPresence)
const sendParentNotificationUtil = async (enfantId, type, time) => {
  try {
    // Récupérer les informations de l'enfant et du parent
    const enfant = await Enfant.findById(enfantId).populate('parentId', 'nom prenom telephone');
    if (!enfant || !enfant.parentId || !enfant.parentId.telephone) {
      console.log('Parent ou numéro de téléphone non trouvé pour l\'enfant:', enfantId);
      return;
    }

    // Créer le message personnalisé
    const parentName = `${enfant.parentId.nom} ${enfant.parentId.prenom}`;
    const childName = `${enfant.prenom} ${enfant.nom}`;
    const message = type === 'arrival'
      ? `Bonjour ${parentName}. Votre enfant ${childName} est arrivé(e) à la crèche à ${time}. Bonne journée !`
      : `Bonjour ${parentName}. Votre enfant ${childName} est parti(e) de la crèche à ${time}. Passez une bonne soirée !`;

    // TODO: Implémenter l'envoi réel de SMS
    console.log('SMS à envoyer:', {
      to: enfant.parentId.telephone,
      message: message,
      type: type,
      child: childName,
      time: time
    });

    // Simulation d'envoi réussi
    return { success: true, message: 'Notification envoyée' };

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification SMS:', error);
    throw error;
  }
};

export default {
  getPresences,
  marquerPresence,
  updatePresence,
  getStatsPresence,
  deletePresence,
  sendParentNotification
};