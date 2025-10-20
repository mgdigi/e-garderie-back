import Menu from '../models/Menu.js';

// @desc    Obtenir tous les menus de la crèche
// @route   GET /api/menus
// @access  Private
export const getMenus = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { statut, search } = req.query;

    let query = { crecheId };

    // Filtres
    if (statut) query.statut = statut;

    // Recherche par nom
    if (search) {
      query.nom = { $regex: search, $options: 'i' };
    }

    const menus = await Menu.find(query)
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: menus,
      count: menus.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des menus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des menus',
      error: error.message
    });
  }
};

// @desc    Obtenir un menu par ID
// @route   GET /api/menus/:id
// @access  Private
export const getMenuById = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const menu = await Menu.findOne({
      _id: req.params.id,
      crecheId
    }).populate('crecheId', 'nom').populate('creePar', 'firstName lastName');

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu non trouvé'
      });
    }

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du menu',
      error: error.message
    });
  }
};

// @desc    Créer un nouveau menu
// @route   POST /api/menus
// @access  Private
export const createMenu = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      nom,
      type,
      periode,
      menuHebdomadaire,
      regimesSpeciaux,
      statut,
      remarques
    } = req.body;

    // Créer le menu
    const menu = new Menu({
      nom,
      type,
      periode,
      menuHebdomadaire,
      regimesSpeciaux,
      statut: statut || 'BROUILLON',
      crecheId,
      creePar: req.user._id,
      remarques
    });

    await menu.save();

    const menuWithDetails = await Menu.findById(menu._id)
      .populate('crecheId', 'nom')
      .populate('creePar', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Menu créé avec succès',
      data: menuWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création du menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du menu',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un menu
// @route   PUT /api/menus/:id
// @access  Private
export const updateMenu = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      nom,
      type,
      periode,
      menuHebdomadaire,
      regimesSpeciaux,
      statut,
      remarques
    } = req.body;

    const menu = await Menu.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        nom,
        type,
        periode,
        menuHebdomadaire,
        regimesSpeciaux,
        statut,
        remarques
      },
      { new: true, runValidators: true }
    ).populate('crecheId', 'nom').populate('creePar', 'firstName lastName');

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Menu mis à jour avec succès',
      data: menu
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du menu',
      error: error.message
    });
  }
};

// @desc    Supprimer un menu
// @route   DELETE /api/menus/:id
// @access  Private
export const deleteMenu = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const menu = await Menu.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Menu supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du menu',
      error: error.message
    });
  }
};

export default {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu
};