import Personnel from '../models/Personnel.js';

// @desc    Obtenir tout le personnel de la crèche
// @route   GET /api/personnel
// @access  Private
export const getPersonnel = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { statut, poste, search } = req.query;

    let query = { crecheId };

    // Filtres
    if (statut) query.statut = statut;
    if (poste) query.poste = poste;

    // Recherche par nom ou prénom
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } }
      ];
    }

    const personnel = await Personnel.find(query)
      .populate('crecheId', 'nom')
      .populate('userId', 'email')
      .sort({ nom: 1, prenom: 1 });

    res.json({
      success: true,
      data: personnel,
      count: personnel.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
};

// @desc    Obtenir un membre du personnel par ID
// @route   GET /api/personnel/:id
// @access  Private
export const getPersonnelById = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const personnel = await Personnel.findOne({
      _id: req.params.id,
      crecheId
    }).populate('crecheId', 'nom').populate('userId', 'email');

    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel non trouvé'
      });
    }

    res.json({
      success: true,
      data: personnel
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
};

// @desc    Créer un nouveau membre du personnel
// @route   POST /api/personnel
// @access  Private
export const createPersonnel = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const {
      nom,
      prenom,
      poste,
      telephone,
      email,
      adresse,
      salaire,
      typeContrat,
      dateEmbauche
    } = req.body;

    // Validation des champs requis
    if (!nom || !prenom || !poste || !telephone || !salaire || !typeContrat) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être remplis'
      });
    }

    // Créer le personnel
    const personnel = new Personnel({
      nom,
      prenom,
      poste,
      telephone,
      email,
      adresse,
      salaire,
      typeContrat,
      dateEmbauche: dateEmbauche || new Date(),
      crecheId
    });

    await personnel.save();

    const personnelWithCreche = await Personnel.findById(personnel._id)
      .populate('crecheId', 'nom')
      .populate('userId', 'email');

    res.status(201).json({
      success: true,
      message: 'Personnel créé avec succès',
      data: personnelWithCreche
    });
  } catch (error) {
    console.error('Erreur lors de la création du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du personnel',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un membre du personnel
// @route   PUT /api/personnel/:id
// @access  Private
export const updatePersonnel = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const {
      nom,
      prenom,
      poste,
      telephone,
      email,
      adresse,
      salaire,
      typeContrat,
      statut
    } = req.body;

    const personnel = await Personnel.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        nom,
        prenom,
        poste,
        telephone,
        email,
        adresse,
        salaire,
        typeContrat,
        statut
      },
      { new: true, runValidators: true }
    ).populate('crecheId', 'nom').populate('userId', 'email');

    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Personnel mis à jour avec succès',
      data: personnel
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du personnel',
      error: error.message
    });
  }
};

// @desc    Supprimer un membre du personnel
// @route   DELETE /api/personnel/:id
// @access  Private
export const deletePersonnel = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const personnel = await Personnel.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Personnel supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du personnel',
      error: error.message
    });
  }
};

// @desc    Payer le salaire d'un employé
// @route   POST /api/personnel/:id/payer-salaire
// @access  Private
export const payerSalaire = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { mois, annee, montant, description } = req.body;

    const personnel = await Personnel.findOne({
      _id: req.params.id,
      crecheId
    });

    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel non trouvé'
      });
    }

    if (personnel.statut !== 'ACTIF') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de payer un employé inactif'
      });
    }

    // Importer les modèles nécessaires
    const Paiement = (await import('../models/Paiement.js')).default;

    // Créer le paiement de salaire
    const paiementSalaire = new Paiement({
      type: 'DEPENSE',
      categorie: 'SALAIRES',
      montant: montant || personnel.salaire,
      date: new Date(),
      description: description || `Salaire ${personnel.prenom} ${personnel.nom} - ${mois}/${annee}`,
      statut: 'PAYE', // Les salaires sont directement payés
      methodePaiement: 'VIREMENT', // Par défaut pour les salaires
      personnelId: personnel._id,
      periode: {
        mois: parseInt(mois),
        annee: parseInt(annee)
      },
      crecheId,
      enregistrePar: req.user._id
    });

    await paiementSalaire.save();

    const paiementWithDetails = await Paiement.findById(paiementSalaire._id)
      .populate('personnelId', 'nom prenom poste')
      .populate('enregistrePar', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Salaire payé avec succès',
      data: paiementWithDetails
    });
  } catch (error) {
    console.error('Erreur lors du paiement du salaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement du salaire',
      error: error.message
    });
  }
};

// @desc    Obtenir l'historique des salaires d'un employé
// @route   GET /api/personnel/:id/salaires
// @access  Private
export const getHistoriqueSalaires = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;

    const personnel = await Personnel.findOne({
      _id: req.params.id,
      crecheId
    });

    if (!personnel) {
      return res.status(404).json({
        success: false,
        message: 'Personnel non trouvé'
      });
    }

    // Importer le modèle Paiement
    const Paiement = (await import('../models/Paiement.js')).default;

    const paiements = await Paiement.find({
      personnelId: personnel._id,
      categorie: 'SALAIRES',
      crecheId
    })
      .populate('enregistrePar', 'firstName lastName')
      .sort({ 'periode.annee': -1, 'periode.mois': -1 });

    res.json({
      success: true,
      data: paiements,
      count: paiements.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des salaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique des salaires',
      error: error.message
    });
  }
};

export default {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  payerSalaire,
  getHistoriqueSalaires
};