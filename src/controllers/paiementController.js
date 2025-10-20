import Paiement from '../models/Paiement.js';
import Facture from '../models/Facture.js';
import Enfant from '../models/Enfant.js';

// @desc    Créer un paiement mensuel automatique
// @route   POST /api/paiements/mensualite-auto
// @access  Private
export const createPaiementMensualite = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { enfantId, mois, annee, montant, methodePaiement = 'ESPECES' } = req.body;

    // Vérifier que l'enfant existe
    const enfant = await Enfant.findOne({ _id: enfantId, crecheId });
    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    // Vérifier si un paiement existe déjà pour cette période
    const existingPaiement = await Paiement.findOne({
      enfantId,
      categorie: 'MENSUALITE',
      'periode.mois': mois,
      'periode.annee': annee,
      crecheId
    });

    if (existingPaiement) {
      return res.status(400).json({
        success: false,
        message: 'Un paiement existe déjà pour cette période'
      });
    }

    // Créer le paiement
    const paiement = new Paiement({
      type: 'RECETTE',
      categorie: 'MENSUALITE',
      montant: montant || enfant.tarifMensuel || 150000,
      montantPaye: montant || enfant.tarifMensuel || 150000,
      date: new Date(),
      description: `Mensualité ${mois}/${annee} pour ${enfant.prenom} ${enfant.nom}`,
      statut: 'PAYE', // Considéré comme payé lors de l'enregistrement
      methodePaiement,
      enfantId,
      periode: { mois, annee },
      crecheId,
      enregistrePar: req.user._id
    });

    await paiement.save();

    // Créer la facture correspondante
    const facture = new Facture({
      enfantId,
      mois,
      annee,
      montant: paiement.montant,
      type: 'MENSUALITE',
      description: `Mensualité ${mois}/${annee} pour ${enfant.prenom} ${enfant.nom}`,
      statut: 'PAID',
      datePaiement: new Date(),
      modePaiement: methodePaiement,
      paiementValidePar: req.user._id,
      crecheId
    });

    await facture.save();

    const paiementWithDetails = await Paiement.findById(paiement._id)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('enregistrePar', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Paiement de mensualité enregistré avec succès',
      data: paiementWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création du paiement de mensualité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement de mensualité',
      error: error.message
    });
  }
};

// @desc    Obtenir les paiements d'un enfant
// @route   GET /api/paiements/enfant/:enfantId
// @access  Private
export const getPaiementsEnfant = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const enfantId = req.params.enfantId;

    const paiements = await Paiement.find({
      enfantId,
      crecheId,
      type: 'RECETTE'
    })
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('enregistrePar', 'firstName lastName')
      .sort({ 'periode.annee': -1, 'periode.mois': -1 });

    res.json({
      success: true,
      data: paiements,
      count: paiements.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements de l\'enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements de l\'enfant',
      error: error.message
    });
  }
};

// @desc    Obtenir tous les paiements
// @route   GET /api/paiements
// @access  Private
export const getPaiements = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { type, categorie, enfantId, dateDebut, dateFin } = req.query;

    let query = { crecheId };

    // Filtres
    if (type) query.type = type;
    if (categorie) query.categorie = categorie;
    if (enfantId) query.enfantId = enfantId;

    // Filtre par date
    if (dateDebut || dateFin) {
      query.date = {};
      if (dateDebut) query.date.$gte = new Date(dateDebut);
      if (dateFin) query.date.$lte = new Date(dateFin);
    }

    const paiements = await Paiement.find(query)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: paiements,
      count: paiements.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: error.message
    });
  }
};

// @desc    Créer un paiement
// @route   POST /api/paiements
// @access  Private
export const createPaiement = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      type,
      categorie,
      montant,
      description,
      date,
      methodePaiement,
      reference,
      enfantId,
      personnelId,
      periode
    } = req.body;

    // Validation des champs requis selon le type et la catégorie
    if (type === 'RECETTE' && ['FRAIS_INSCRIPTION', 'MENSUALITE', 'FRAIS_RETARD'].includes(categorie) && !enfantId) {
      return res.status(400).json({
        success: false,
        message: 'L\'enfant est requis pour cette catégorie de recette'
      });
    }

    if (type === 'DEPENSE' && categorie === 'SALAIRES' && !personnelId) {
      return res.status(400).json({
        success: false,
        message: 'Le personnel est requis pour les salaires'
      });
    }

    const paiement = new Paiement({
      type,
      categorie,
      montant,
      description,
      date: date || new Date(),
      methodePaiement,
      reference,
      enfantId,
      personnelId,
      periode,
      crecheId,
      enregistrePar: req.user._id
    });

    await paiement.save();

    const paiementWithDetails = await Paiement.findById(paiement._id)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: paiementWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement',
      error: error.message
    });
  }
};

// @desc    Obtenir un paiement par ID
// @route   GET /api/paiements/:id
// @access  Private
export const getPaiementById = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const paiement = await Paiement.findOne({
      _id: req.params.id,
      crecheId
    })
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName');

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      data: paiement
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un paiement
// @route   PUT /api/paiements/:id
// @access  Private
export const updatePaiement = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      type,
      categorie,
      montant,
      description,
      date,
      methodePaiement,
      reference,
      statut,
      enfantId,
      personnelId,
      periode
    } = req.body;

    const paiement = await Paiement.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        type,
        categorie,
        montant,
        description,
        date,
        methodePaiement,
        reference,
        statut,
        enfantId,
        personnelId,
        periode
      },
      { new: true, runValidators: true }
    )
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName');

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Paiement mis à jour avec succès',
      data: paiement
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paiement',
      error: error.message
    });
  }
};

// @desc    Supprimer un paiement
// @route   DELETE /api/paiements/:id
// @access  Private
export const deletePaiement = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const paiement = await Paiement.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Paiement supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du paiement',
      error: error.message
    });
  }
};

// @desc    Valider un paiement
// @route   PUT /api/paiements/:id/valider
// @access  Private
export const validerPaiement = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const paiement = await Paiement.findOne({
      _id: req.params.id,
      crecheId
    });

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    if (paiement.statut === 'PAYE') {
      return res.status(400).json({
        success: false,
        message: 'Ce paiement est déjà validé'
      });
    }

    // Mettre à jour le statut du paiement
    paiement.statut = 'PAYE';
    await paiement.save();

    // Si c'est un paiement d'inscription, mettre à jour la facture correspondante
    if (paiement.categorie === 'FRAIS_INSCRIPTION') {
      const facture = await Facture.findOne({
        enfantId: paiement.enfantId,
        type: 'INSCRIPTION',
        statut: 'EN_ATTENTE'
      });

      if (facture) {
        facture.statut = 'PAID';
        facture.datePaiement = new Date();
        facture.modePaiement = paiement.methodePaiement;
        facture.paiementValidePar = req.user._id;
        await facture.save();
      }
    }

    const paiementWithDetails = await Paiement.findById(paiement._id)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName');

    res.json({
      success: true,
      message: 'Paiement validé avec succès',
      data: paiementWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la validation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du paiement',
      error: error.message
    });
  }
};

// @desc    Générer un reçu PDF pour un paiement
// @route   GET /api/paiements/:id/recu
// @access  Private
export const genererRecuPDF = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const paiement = await Paiement.findOne({
      _id: req.params.id,
      crecheId,
      statut: 'PAYE'
    })
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('crecheId', 'nom adresse telephone email')
      .populate('enregistrePar', 'firstName lastName');

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé ou non validé'
      });
    }

    // Ici nous allons utiliser une bibliothèque PDF comme pdfkit ou puppeteer
    // Pour l'instant, nous retournons les données pour génération côté client
    res.json({
      success: true,
      data: {
        paiement,
        creche: paiement.crecheId,
        enfant: paiement.enfantId,
        validePar: paiement.enregistrePar
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du reçu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du reçu',
      error: error.message
    });
  }
};

export default {
  getPaiements,
  createPaiement,
  getPaiementById,
  updatePaiement,
  deletePaiement,
  validerPaiement,
  genererRecuPDF,
  createPaiementMensualite,
  getPaiementsEnfant
};
