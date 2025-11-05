import Creche from '../models/Creche.js';
import Classe from '../models/Classe.js';

// @desc    Obtenir les paramètres de la crèche
// @route   GET /api/parametres
// @access  Private
export const getParametres = async (req, res) => {
  try {
    if (!req.user || !req.user.crecheId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const crecheId = req.user.crecheId?._id || req.user.crecheId;

    const creche = await Creche.findById(crecheId);
    if (!creche) {
      return res.status(404).json({
        success: false,
        message: 'Crèche non trouvée'
      });
    }

    // Récupérer les classes de la crèche
    const classes = await Classe.find({
      crecheId,
      isActive: true
    }).sort({ nom: 1 });

    res.json({
      success: true,
      data: {
        creche: {
          _id: creche._id,
          nom: creche.nom,
          adresse: creche.adresse,
          telephone: creche.telephone,
          email: creche.email,
          logo: creche.logo || '/images/logo.png',
          capaciteMaximale: creche.capaciteMaximale,
          heuresOuverture: creche.heuresOuverture,
          joursOuverture: creche.joursOuverture,
          fraisInscription: creche.tarifs?.inscription || 0,
          tarifMensuel: creche.tarifs?.mensuel || 0
        },
        classes
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};



// @desc    Mettre à jour les paramètres de la crèche
// @route   PUT /api/parametres/creche
// @access  Private
export const updateParametresCreche = async (req, res) => {
  try {
    if (!req.user || !req.user.crecheId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const {
      nom,
      adresse,
      telephone,
      email,
      capaciteMaximale,
      heuresOuverture,
      joursOuverture,
      fraisInscription,
      mensualite,
      logo
    } = req.body;

    const updateData = {
      nom,
      adresse,
      telephone,
      email,
      capaciteMaximale,
      heuresOuverture,
      joursOuverture,
      tarifs: {
        inscription: fraisInscription,
        mensuel: mensualite
      }
    };

    // Always update logo if provided
    if (logo !== undefined) {
      updateData.logo = logo;
    }

    const creche = await Creche.findByIdAndUpdate(
      crecheId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!creche) {
      return res.status(404).json({
        success: false,
        message: 'Crèche non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Paramètres de la crèche mis à jour avec succès',
      data: creche
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle classe
// @route   POST /api/parametres/classes
// @access  Private
export const createClasse = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { nom, capacite, ageMin, ageMax, description } = req.body;

    // Validation des données
    if (!nom || !capacite || ageMin === undefined || ageMax === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nom, capacité, âge minimum et âge maximum sont requis'
      });
    }

    if (ageMin >= ageMax) {
      return res.status(400).json({
        success: false,
        message: 'L\'âge maximum doit être supérieur à l\'âge minimum'
      });
    }

    // Vérifier si une classe avec ce nom existe déjà
    const classeExistante = await Classe.findOne({
      crecheId,
      nom: nom.trim(),
      isActive: true
    });

    if (classeExistante) {
      return res.status(409).json({
        success: false,
        message: 'Une classe avec ce nom existe déjà'
      });
    }

    const classe = new Classe({
      nom: nom.trim(),
      capacite,
      ageMin,
      ageMax,
      description: description?.trim(),
      crecheId
    });

    await classe.save();

    const classeWithCreche = await Classe.findById(classe._id).populate('crecheId', 'nom');

    res.status(201).json({
      success: true,
      message: 'Classe créée avec succès',
      data: classeWithCreche
    });
  } catch (error) {
    console.error('Erreur lors de la création de la classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la classe',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une classe
// @route   PUT /api/parametres/classes/:id
// @access  Private
export const updateClasse = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { nom, capacite, ageMin, ageMax, description } = req.body;

    const classe = await Classe.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        nom: nom?.trim(),
        capacite,
        ageMin,
        ageMax,
        description: description?.trim()
      },
      { new: true, runValidators: true }
    );

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Classe mise à jour avec succès',
      data: classe
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la classe',
      error: error.message
    });
  }
};

// @desc    Supprimer une classe
// @route   DELETE /api/parametres/classes/:id
// @access  Private
export const deleteClasse = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;

    // Vérifier si la classe a des enfants actifs
    const enfantsDansClasse = await require('../models/Enfant.js').default.countDocuments({
      crecheId,
      section: req.params.id,
      statut: 'ACTIF'
    });

    if (enfantsDansClasse > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer cette classe car elle contient ${enfantsDansClasse} enfant(s) actif(s)`
      });
    }

    const classe = await Classe.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      { isActive: false },
      { new: true }
    );

    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Classe supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la classe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la classe',
      error: error.message
    });
  }
};

// @desc    Obtenir toutes les classes
// @route   GET /api/parametres/classes
// @access  Private
export const getClasses = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;

    const classes = await Classe.find({
      crecheId,
      isActive: true
    }).sort({ nom: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des classes',
      error: error.message
    });
  }
};

export default {
  getParametres,
  updateParametresCreche,
  createClasse,
  updateClasse,
  deleteClasse,
  getClasses
};