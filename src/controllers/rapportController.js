import Enfant from '../models/Enfant.js';
import Personnel from '../models/Personnel.js';
import Presence from '../models/Presence.js';
import Paiement from '../models/Paiement.js';
import Facture from '../models/Facture.js';

// @desc    Rapport détaillé des enfants
// @route   GET /api/rapports/enfants
// @access  Private
export const getEnfantsReport = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { startDate, endDate, section } = req.query;

    // Récupérer les enfants filtrés par période de création
    let enfantsQuery = { crecheId };
    if (section) {
      enfantsQuery.section = section;
    }
    if (startDate && endDate) {
      enfantsQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const enfants = await Enfant.find(enfantsQuery)
      .populate('parentId', 'nom prenom telephone')
      .sort({ nom: 1, prenom: 1 });

    const reportData = await Promise.all(
      enfants.map(async (enfant) => {
        // Statistiques de présence
        const presencesQuery = {
          enfantId: enfant._id,
          date: {
            $gte: new Date(startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
            $lte: new Date(endDate || new Date())
          }
        };

        const presences = await Presence.find(presencesQuery);
        const joursOuvrables = presences.filter(p => p.statut !== 'FERIE' && p.statut !== 'VACANCES').length;
        const joursPresents = presences.filter(p => p.statut === 'PRESENT').length;
        const joursAbsents = joursOuvrables - joursPresents;

        // Statistiques de paiement
        const factures = await Facture.find({
          enfantId: enfant._id,
          createdAt: {
            $gte: new Date(startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
            $lte: new Date(endDate || new Date())
          }
        });

        const mensualitesPayees = factures.filter(f => f.statut === 'PAID').length;
        const mensualitesDuJour = factures.length;
        const totalDu = factures.reduce((sum, f) => sum + f.montant, 0);
        const totalPaye = factures.filter(f => f.statut === 'PAID').reduce((sum, f) => sum + f.montant, 0);

        return {
          _id: enfant._id,
          nom: enfant.nom,
          prenom: enfant.prenom,
          numeroInscription: enfant.numeroInscription,
          dateNaissance: enfant.dateNaissance,
          section: enfant.section,
          parent: enfant.parentId ? {
            nom: `${enfant.parentId.nom} ${enfant.parentId.prenom}`,
            telephone: enfant.parentId.telephone
          } : null,
          presenceStats: {
            totalJours: joursOuvrables,
            joursPresents,
            joursAbsents,
            tauxPresence: joursOuvrables > 0 ? Math.round((joursPresents / joursOuvrables) * 100 * 10) / 10 : 0
          },
          paiementStats: {
            mensualitesPayees,
            mensualitesDuJour,
            totalDu,
            totalPaye,
            solde: totalDu - totalPaye
          }
        };
      })
    );

    res.json({
      success: true,
      data: reportData,
      count: reportData.length,
      periode: {
        debut: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: endDate || new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Erreur génération rapport enfants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport enfants',
      error: error.message
    });
  }
};

// @desc    Rapport de présence
// @route   GET /api/rapports/presence
// @access  Private
export const getPresenceReport = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const reportData = [];
    const totalEnfants = await Enfant.countDocuments({ crecheId });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Ne compter que les jours ouvrables (lundi-vendredi)
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const dateStr = d.toISOString().split('T')[0];

      // Présences des enfants
      const enfantPresences = await Presence.find({
        date: dateStr,
        statut: { $in: ['PRESENT', 'ABSENT', 'RETARD'] }
      });

      const presents = enfantPresences.filter(p => p.statut === 'PRESENT').length;
      const absents = enfantPresences.filter(p => p.statut === 'ABSENT').length;

      // Présences du personnel
      const personnelPresences = await Presence.find({
        date: dateStr,
        personnelId: { $exists: true }
      });

      const personnelPresents = personnelPresences.filter(p => p.statut === 'PRESENT').length;
      const personnelAbsents = personnelPresences.filter(p => p.statut === 'ABSENT').length;

      reportData.push({
        date: dateStr,
        totalEnfants,
        presents,
        absents: totalEnfants - presents, // Calculer les absents
        tauxPresence: totalEnfants > 0 ? Math.round((presents / totalEnfants) * 100 * 10) / 10 : 0,
        personnelPresents,
        personnelAbsents
      });
    }

    res.json({
      success: true,
      data: reportData,
      periode: { debut: startDate, fin: endDate }
    });
  } catch (error) {
    console.error('Erreur génération rapport présence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport de présence',
      error: error.message
    });
  }
};

// @desc    Rapport financier
// @route   GET /api/rapports/financier
// @access  Private
export const getFinancialReport = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { startDate, endDate } = req.query;

    // Récupérer toutes les transactions
    const transactions = await Paiement.find({
      crecheId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      statut: { $ne: 'ANNULE' }
    });

    // Séparer recettes et dépenses
    const recettes = transactions.filter(t => t.type === 'RECETTE');
    const depenses = transactions.filter(t => t.type === 'DEPENSE');

    // Calculer les totaux par catégorie
    const recettesParCategorie = {};
    const depensesParCategorie = {};

    recettes.forEach(recette => {
      recettesParCategorie[recette.categorie] = (recettesParCategorie[recette.categorie] || 0) + recette.montantPaye;
    });

    depenses.forEach(depense => {
      depensesParCategorie[depense.categorie] = (depensesParCategorie[depense.categorie] || 0) + depense.montantPaye;
    });

    const totalRecettes = recettes.reduce((sum, r) => sum + r.montantPaye, 0);
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montantPaye, 0);

    res.json({
      success: true,
      data: {
        periode: `${startDate} - ${endDate}`,
        recettes: {
          total: totalRecettes,
          parCategorie: recettesParCategorie,
          evolution: [] // À implémenter avec des données historiques
        },
        depenses: {
          total: totalDepenses,
          parCategorie: depensesParCategorie,
          evolution: [] // À implémenter avec des données historiques
        },
        solde: totalRecettes - totalDepenses,
        margeBeneficiaire: totalRecettes > 0 ? ((totalRecettes - totalDepenses) / totalRecettes) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Erreur génération rapport financier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport financier',
      error: error.message
    });
  }
};

// @desc    Rapport du personnel
// @route   GET /api/rapports/personnel
// @access  Private
export const getPersonnelReport = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { startDate, endDate } = req.query;

    const personnel = await Personnel.find({ crecheId })
      .sort({ nom: 1, prenom: 1 });

    const reportData = await Promise.all(
      personnel.map(async (member) => {
        // Statistiques de présence
        const presences = await Presence.find({
          personnelId: member._id,
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        });

        const joursOuvrables = presences.filter(p => p.statut !== 'CONGE' && p.statut !== 'FERIE').length;
        const joursPresents = presences.filter(p => p.statut === 'PRESENT').length;

        // Dernier paiement de salaire
        const dernierPaiement = await Paiement.findOne({
          personnelId: member._id,
          type: 'DEPENSE',
          categorie: 'SALAIRES',
          statut: 'PAYE'
        }).sort({ date: -1 });

        return {
          _id: member._id,
          nom: member.nom,
          prenom: member.prenom,
          poste: member.poste,
          dateEmbauche: member.dateEmbauche,
          salaire: member.salaire,
          presenceStats: {
            totalJours: joursOuvrables,
            joursPresents,
            joursAbsents: joursOuvrables - joursPresents,
            tauxPresence: joursOuvrables > 0 ? Math.round((joursPresents / joursOuvrables) * 100 * 10) / 10 : 0
          },
          dernierPaiementSalaire: dernierPaiement ? dernierPaiement.date : null
        };
      })
    );

    res.json({
      success: true,
      data: reportData,
      count: reportData.length,
      periode: { debut: startDate, fin: endDate }
    });
  } catch (error) {
    console.error('Erreur génération rapport personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport personnel',
      error: error.message
    });
  }
};

// @desc    Statistiques générales pour le dashboard
// @route   GET /api/rapports/statistiques-generales
// @access  Private
export const getGeneralStats = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;

    // Statistiques des enfants
    const totalEnfants = await Enfant.countDocuments({ crecheId });
    const enfantsPresents = await Presence.countDocuments({
      statut: 'PRESENT',
      date: new Date().toISOString().split('T')[0]
    });

    // Statistiques du personnel
    const totalPersonnel = await Personnel.countDocuments({ crecheId });
    const personnelPresents = await Presence.countDocuments({
      personnelId: { $exists: true },
      statut: 'PRESENT',
      date: new Date().toISOString().split('T')[0]
    });

    // Statistiques financières du jour
    const today = new Date().toISOString().split('T')[0];
    const transactionsToday = await Paiement.find({
      crecheId,
      date: today,
      statut: { $ne: 'ANNULE' }
    });

    const recettesDuJour = transactionsToday
      .filter(t => t.type === 'RECETTE')
      .reduce((sum, t) => sum + t.montantPaye, 0);

    const depensesDuJour = transactionsToday
      .filter(t => t.type === 'DEPENSE')
      .reduce((sum, t) => sum + t.montantPaye, 0);

    res.json({
      success: true,
      data: {
        enfants: {
          total: totalEnfants,
          presents: enfantsPresents,
          absents: Math.max(0, totalEnfants - enfantsPresents)
        },
        personnel: {
          total: totalPersonnel,
          presents: personnelPresents,
          absents: Math.max(0, totalPersonnel - personnelPresents)
        },
        finances: {
          recettesDuJour,
          depensesDuJour
        }
      }
    });
  } catch (error) {
    console.error('Erreur génération statistiques générales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des statistiques générales',
      error: error.message
    });
  }
};

export default {
  getEnfantsReport,
  getPresenceReport,
  getFinancialReport,
  getPersonnelReport,
  getGeneralStats
};