import mongoose from 'mongoose';
import Enfant from '../models/Enfant.js';
import Personnel from '../models/Personnel.js';
import Presence from '../models/Presence.js';
import Paiement from '../models/Paiement.js';

// @desc    Obtenir les statistiques du tableau de bord
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Statistiques générales
    const totalEnfants = await Enfant.countDocuments({ 
      crecheId, 
      statut: 'ACTIF' 
    });

    const totalPersonnel = await Personnel.countDocuments({ 
      crecheId, 
      statut: 'ACTIF' 
    });

    // Présences du jour
    const enfantsPresents = await Presence.countDocuments({
      crecheId,
      type: 'ENFANT',
      date: { $gte: today, $lt: tomorrow },
      statut: 'PRESENT'
    });

    const personnelPresent = await Presence.countDocuments({
      crecheId,
      type: 'PERSONNEL',
      date: { $gte: today, $lt: tomorrow },
      statut: 'PRESENT'
    });

    // Finances du jour
    const recettesDuJour = await Paiement.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          type: 'RECETTE',
          date: { $gte: today, $lt: tomorrow },
          statut: { $ne: 'ANNULE' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montantPaye' }
        }
      }
    ]);

    const depensesDuJour = await Paiement.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          type: 'DEPENSE',
          date: { $gte: today, $lt: tomorrow },
          statut: { $ne: 'ANNULE' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montantPaye' }
        }
      }
    ]);

    // Alertes
    const alertes = await getAlertes(crecheId);

    res.json({
      success: true,
      data: {
        enfants: {
          total: totalEnfants,
          presents: enfantsPresents,
          absents: totalEnfants - enfantsPresents
        },
        personnel: {
          total: totalPersonnel,
          presents: personnelPresent,
          absents: totalPersonnel - personnelPresent
        },
        finances: {
          recettesDuJour: recettesDuJour.length > 0 ? recettesDuJour[0].total : 0,
          depensesDuJour: depensesDuJour.length > 0 ? depensesDuJour[0].total : 0
        },
        alertes
      }
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

// @desc    Obtenir les graphiques du tableau de bord
// @route   GET /api/dashboard/charts
// @access  Private
export const getDashboardCharts = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { periode = '30' } = req.query; // Période en jours
    
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - parseInt(periode));
    dateDebut.setHours(0, 0, 0, 0);
    
    const dateFin = new Date();
    dateFin.setHours(23, 59, 59, 999);

    // Évolution des présences
    const presencesEvolution = await Presence.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          date: { $gte: dateDebut, $lte: dateFin }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type',
            statut: '$statut'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Répartition financière
    const repartitionFinanciere = await Paiement.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          date: { $gte: dateDebut, $lte: dateFin },
          statut: { $ne: 'ANNULE' }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            categorie: '$categorie'
          },
          total: { $sum: '$montantPaye' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Taux de présence par section
    const presenceParSection = await Presence.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          type: 'ENFANT',
          date: { $gte: dateDebut, $lte: dateFin }
        }
      },
      {
        $lookup: {
          from: 'enfants',
          localField: 'enfantId',
          foreignField: '_id',
          as: 'enfant'
        }
      },
      {
        $unwind: '$enfant'
      },
      {
        $group: {
          _id: {
            section: '$enfant.section',
            statut: '$statut'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        presencesEvolution,
        repartitionFinanciere,
        presenceParSection
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des graphiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des graphiques',
      error: error.message
    });
  }
};

// @desc    Obtenir les activités récentes
// @route   GET /api/dashboard/recent-activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { limit = 10 } = req.query;

    // Dernières inscriptions
    const dernieresInscriptions = await Enfant.find({ 
      crecheId, 
      statut: 'ACTIF' 
    })
    .sort({ dateInscription: -1 })
    .limit(parseInt(limit) / 2)
    .select('nom prenom dateInscription section');

    // Derniers paiements
    const derniersPaiements = await Paiement.find({ 
      crecheId,
      statut: { $ne: 'ANNULE' }
    })
    .populate('enfantId', 'nom prenom')
    .populate('personnelId', 'nom prenom')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) / 2)
    .select('type categorie montantPaye date enfantId personnelId description');

    res.json({
      success: true,
      data: {
        inscriptions: dernieresInscriptions,
        paiements: derniersPaiements
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des activités récentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités récentes',
      error: error.message
    });
  }
};

// Fonction utilitaire pour obtenir les alertes
const getAlertes = async (crecheId) => {
  const alertes = [];
  const today = new Date();
  
  try {
    // Paiements en retard (mensualités non payées)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const paiementsEnRetard = await Paiement.countDocuments({
      crecheId,
      type: 'RECETTE',
      categorie: 'MENSUALITE',
      'periode.mois': { $lt: currentMonth },
      'periode.annee': currentYear,
      statut: { $in: ['EN_ATTENTE', 'PARTIEL'] }
    });

    if (paiementsEnRetard > 0) {
      alertes.push({
        type: 'warning',
        message: `${paiementsEnRetard} paiement(s) en retard`,
        count: paiementsEnRetard
      });
    }

    // Absences répétées (plus de 3 jours consécutifs)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 7);
    
    const absencesRepetees = await Presence.aggregate([
      {
        $match: {
          crecheId: new mongoose.Types.ObjectId(crecheId),
          type: 'ENFANT',
          statut: { $in: ['ABSENT', 'ABSENCE_INJUSTIFIEE'] },
          date: { $gte: dateDebut, $lte: today }
        }
      },
      {
        $group: {
          _id: '$enfantId',
          absences: { $sum: 1 }
        }
      },
      {
        $match: {
          absences: { $gte: 3 }
        }
      }
    ]);

    if (absencesRepetees.length > 0) {
      alertes.push({
        type: 'danger',
        message: `${absencesRepetees.length} enfant(s) avec absences répétées`,
        count: absencesRepetees.length
      });
    }

    // Capacité proche du maximum
    const totalEnfants = await Enfant.countDocuments({ 
      crecheId, 
      statut: 'ACTIF' 
    });
    
    const creche = await mongoose.model('Creche').findById(crecheId);
    if (creche && totalEnfants >= creche.capaciteMaximale * 0.9) {
      alertes.push({
        type: 'info',
        message: 'Capacité d\'accueil bientôt atteinte',
        count: totalEnfants
      });
    }

  } catch (error) {
    console.error('Erreur lors de la génération des alertes:', error);
  }

  return alertes;
};

export default {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities
};