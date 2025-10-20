import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Creche from '../models/Creche.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const createDefaultSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log('Super Admin par défaut déjà créé');
      return;
    }

    const superAdmin = new User({
      email: 'superadmin@garderie.com',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+221 77 123 45 67',
      isActive: true
    });

    await superAdmin.save();
    console.log('Super Admin par défaut créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création du Super Admin par défaut:', error);
  }
};

export const createDefaultCrecheAndAdmin = async () => {
  try {
    const existingCreche = await Creche.findOne({ nom: 'Crèche Demo' });
    if (existingCreche) {
      console.log('Crèche par défaut déjà créée');
      return;
    }

    const creche = new Creche({
      nom: 'Crèche Demo',
      adresse: '123 Rue de la Garderie, Dakar',
      telephone: '+221 77 123 45 67',
      email: 'contact@crechedemo.com',
      capaciteMaximale: 50
    });

    await creche.save();
    console.log('Crèche par défaut créée avec succès');

    // Créer l'admin de la crèche
    const admin = new User({
      email: 'admin@creche.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'Crèche',
      role: 'ADMIN',
      phone: '+221 77 123 45 67',
      crecheId: creche._id,
      isActive: true
    });

    await admin.save();
  } catch (error) {
    console.error('Erreur lors de la création de la crèche et admin par défaut:', error);
  }
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone, crecheData } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    let crecheId;

    // Si c'est un admin, créer une nouvelle crèche
    if (role === 'ADMIN') {
      if (!crecheData) {
        return res.status(400).json({
          success: false,
          message: 'Les informations de la crèche sont requises pour un admin'
        });
      }

      const creche = new Creche(crecheData);
      await creche.save();
      crecheId = creche._id;
    } else if (role === 'SUPER_ADMIN') {
      // Pour le super admin, pas de crèche requise
      crecheId = null;
    } else {
      // Pour les autres rôles, la crèche doit être spécifiée
      if (!req.body.crecheId) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID de la crèche est requis'
        });
      }
      crecheId = req.body.crecheId;
    }

    // Créer l'utilisateur
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

    // Générer le token
    const token = generateToken(user._id);

    // Récupérer l'utilisateur avec les informations de la crèche (si applicable)
    const userWithCreche = await User.findById(user._id).populate('crecheId');

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: userWithCreche,
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

   
    const user = await User.findOne({ email }).populate('crecheId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email  incorrect !'
      });
    }

    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: ' mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Erreur email ou mots de passe incorrect ! :', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};


export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('crecheId');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).populate('crecheId');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    const user = await User.findById(req.user._id);

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe (demande)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    // TODO: Implémenter l'envoi d'email de réinitialisation
    // Pour l'instant, on retourne juste un message de succès

    res.json({
      success: true,
      message: 'Instructions de réinitialisation envoyées par email'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
};

// @desc    Vérifier la validité du token
// @route   GET /api/auth/verify-token
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token valide',
      data: { user: req.user }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du token',
      error: error.message
    });
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyToken,
  createDefaultSuperAdmin,
  createDefaultCrecheAndAdmin
};