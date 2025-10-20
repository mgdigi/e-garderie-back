import EmploiDuTemps from '../models/EmploiDuTemps.js';

// @desc    Obtenir tous les emplois du temps de la crèche
// @route   GET /api/emplois-du-temps
// @access  Private
export const getEmploisDuTemps = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { section, statut, search } = req.query;

    let query = { crecheId };

    // Filtres
    if (section) query.section = section;
    if (statut) query.statut = statut;

    // Recherche par nom
    if (search) {
      query.nom = { $regex: search, $options: 'i' };
    }

    const emploisDuTemps = await EmploiDuTemps.find(query)
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName')
      .populate('planning.lundi.educatriceId', 'nom prenom')
      .populate('planning.mardi.educatriceId', 'nom prenom')
      .populate('planning.mercredi.educatriceId', 'nom prenom')
      .populate('planning.jeudi.educatriceId', 'nom prenom')
      .populate('planning.vendredi.educatriceId', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: emploisDuTemps,
      count: emploisDuTemps.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des emplois du temps:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des emplois du temps',
      error: error.message
    });
  }
};

// @desc    Obtenir un emploi du temps par ID
// @route   GET /api/emplois-du-temps/:id
// @access  Private
export const getEmploiDuTempsById = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const emploiDuTemps = await EmploiDuTemps.findOne({
      _id: req.params.id,
      crecheId
    })
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName')
      .populate('planning.lundi.educatriceId', 'nom prenom')
      .populate('planning.mardi.educatriceId', 'nom prenom')
      .populate('planning.mercredi.educatriceId', 'nom prenom')
      .populate('planning.jeudi.educatriceId', 'nom prenom')
      .populate('planning.vendredi.educatriceId', 'nom prenom');

    if (!emploiDuTemps) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé'
      });
    }

    res.json({
      success: true,
      data: emploiDuTemps
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'emploi du temps',
      error: error.message
    });
  }
};

// @desc    Créer un nouvel emploi du temps
// @route   POST /api/emplois-du-temps
// @access  Private
export const createEmploiDuTemps = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      nom,
      section,
      semaine,
      planning,
      statut,
      remarques
    } = req.body;

    // Créer l'emploi du temps
    const emploiDuTemps = new EmploiDuTemps({
      nom,
      section,
      semaine,
      planning,
      statut: statut || 'BROUILLON',
      crecheId,
      creePar: req.user._id,
      remarques
    });

    await emploiDuTemps.save();

    const emploiDuTempsWithDetails = await EmploiDuTemps.findById(emploiDuTemps._id)
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName')
      .populate('planning.lundi.educatriceId', 'nom prenom')
      .populate('planning.mardi.educatriceId', 'nom prenom')
      .populate('planning.mercredi.educatriceId', 'nom prenom')
      .populate('planning.jeudi.educatriceId', 'nom prenom')
      .populate('planning.vendredi.educatriceId', 'nom prenom');

    res.status(201).json({
      success: true,
      message: 'Emploi du temps créé avec succès',
      data: emploiDuTempsWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'emploi du temps:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'emploi du temps',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un emploi du temps
// @route   PUT /api/emplois-du-temps/:id
// @access  Private
export const updateEmploiDuTemps = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      nom,
      section,
      semaine,
      planning,
      statut,
      remarques
    } = req.body;

    const emploiDuTemps = await EmploiDuTemps.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        nom,
        section,
        semaine,
        planning,
        statut,
        remarques
      },
      { new: true, runValidators: true }
    )
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName')
      .populate('planning.lundi.educatriceId', 'nom prenom')
      .populate('planning.mardi.educatriceId', 'nom prenom')
      .populate('planning.mercredi.educatriceId', 'nom prenom')
      .populate('planning.jeudi.educatriceId', 'nom prenom')
      .populate('planning.vendredi.educatriceId', 'nom prenom');

    if (!emploiDuTemps) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Emploi du temps mis à jour avec succès',
      data: emploiDuTemps
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'emploi du temps:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'emploi du temps',
      error: error.message
    });
  }
};

// @desc    Supprimer un emploi du temps
// @route   DELETE /api/emplois-du-temps/:id
// @access  Private
export const deleteEmploiDuTemps = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const emploiDuTemps = await EmploiDuTemps.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!emploiDuTemps) {
      return res.status(404).json({
        success: false,
        message: 'Emploi du temps non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Emploi du temps supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'emploi du temps:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'emploi du temps',
      error: error.message
    });
  }
};

export default {
  getEmploisDuTemps,
  getEmploiDuTempsById,
  createEmploiDuTemps,
  updateEmploiDuTemps,
  deleteEmploiDuTemps
};