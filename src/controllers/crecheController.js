import Creche from '../models/Creche.js';
import User from '../models/User.js';


export const getCreche = async (req, res) => {
  try {
    const creche = await Creche.findById(req.params.id);
    
    if (!creche) {
      return res.status(404).json({
        success: false,
        message: 'Crèche non trouvée'
      });
    }

    res.json({
      success: true,
      data: { creche }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la crèche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la crèche',
      error: error.message
    });
  }
};

// @desc    Mettre à jour les informations de la crèche
// @route   PUT /api/creches/:id
// @access  Private (DIRECTRICE seulement)
export const updateCreche = async (req, res) => {
  try {
    const {
      nom,
      adresse,
      telephone,
      email,
      logo,
      couleurTheme,
      capaciteMaximale,
      heuresOuverture,
      joursOuverture,
      tarifs,
      sections
    } = req.body;

    const creche = await Creche.findByIdAndUpdate(
      req.params.id,
      {
        nom,
        adresse,
        telephone,
        email,
        logo,
        couleurTheme,
        capaciteMaximale,
        heuresOuverture,
        joursOuverture,
        tarifs,
        sections
      },
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
      message: 'Crèche mise à jour avec succès',
      data: { creche }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la crèche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la crèche',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques de la crèche
// @route   GET /api/creches/:id/stats
// @access  Private
export const getCrecheStats = async (req, res) => {
  try {
    const crecheId = req.params.id;
    
    // Import dynamique pour éviter les dépendances circulaires
    const { default: Enfant } = await import('../models/Enfant.js');
    const { default: Personnel } = await import('../models/Personnel.js');
    const { default: Presence } = await import('../models/Presence.js');
    const { default: Paiement } = await import('../models/Paiement.js');

    // Statistiques des enfants
    const totalEnfants = await Enfant.countDocuments({ crecheId, statut: 'ACTIF' });
    const enfantsParSection = await Enfant.aggregate([
      { $match: { crecheId: new mongoose.Types.ObjectId(crecheId), statut: 'ACTIF' } },
      { $group: { _id: '$section', count: { $sum: 1 } } }
    ]);

    // Statistiques du personnel
    const totalPersonnel = await Personnel.countDocuments({ crecheId, statut: 'ACTIF' });
    const personnelParPoste = await Personnel.aggregate([
      { $match: { crecheId: new mongoose.Types.ObjectId(crecheId), statut: 'ACTIF' } },
      { $group: { _id: '$poste', count: { $sum: 1 } } }
    ]);

    // Présences du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presencesAujourdhui = await Presence.countDocuments({
      crecheId,
      date: { $gte: today, $lt: tomorrow },
      statut: 'PRESENT'
    });

    // Finances du mois
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const financesMois = await Paiement.getSolde(crecheId, startOfMonth, endOfMonth);

    res.json({
      success: true,
      data: {
        enfants: {
          total: totalEnfants,
          parSection: enfantsParSection
        },
        personnel: {
          total: totalPersonnel,
          parPoste: personnelParPoste
        },
        presences: {
          aujourdhui: presencesAujourdhui
        },
        finances: financesMois
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

// @desc    Obtenir les utilisateurs de la crèche
// @route   GET /api/creches/:id/users
// @access  Private (DIRECTRICE seulement)
export const getCrecheUsers = async (req, res) => {
  try {
    const users = await User.find({ crecheId: req.params.id })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// @desc    Créer un nouvel utilisateur pour la crèche
// @route   POST /api/creches/:id/users
// @access  Private (DIRECTRICE seulement)
export const createCrecheUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;
    const crecheId = req.params.id;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      crecheId
    });

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const userWithoutPassword = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { user: userWithoutPassword }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un utilisateur de la crèche
// @route   PUT /api/creches/:id/users/:userId
// @access  Private (DIRECTRICE seulement)
export const updateCrecheUser = async (req, res) => {
  try {
    const { firstName, lastName, role, phone, isActive } = req.body;
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, role, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Supprimer un utilisateur de la crèche
// @route   DELETE /api/creches/:id/users/:userId
// @access  Private (DIRECTRICE seulement)
export const deleteCrecheUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

export default {
  getCreche,
  updateCreche,
  getCrecheStats,
  getCrecheUsers,
  createCrecheUser,
  updateCrecheUser,
  deleteCrecheUser
};