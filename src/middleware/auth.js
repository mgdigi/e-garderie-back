import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware d'authentification
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('crecheId');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Utilisateur non trouvé.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.'
    });
  }
};

// Middleware d'autorisation par rôle
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Permissions insuffisantes.'
      });
    }

    next();
  };
};

// Middleware pour vérifier l'appartenance à la crèche
export const checkCrecheAccess = (req, res, next) => {
  try {
    const crecheId = req.params.crecheId || req.body.crecheId || req.query.crecheId;
    
    if (!crecheId) {
      return res.status(400).json({
        success: false,
        message: 'ID de crèche requis.'
      });
    }

    // Vérifier si l'utilisateur appartient à cette crèche
    if (req.user.crecheId?._id.toString() !== crecheId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette crèche.'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification d\'accès crèche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.'
    });
  }
};

// Middleware pour les routes optionnellement authentifiées
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('crecheId');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    next();
  }
};

// Middleware de validation des permissions spécifiques
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    const rolePermissions = {
      DIRECTRICE: [
        'manage_all', 'view_all', 'create_all', 'update_all', 'delete_all',
        'manage_users', 'manage_personnel', 'manage_enfants', 'manage_finances',
        'view_reports', 'manage_settings'
      ],
      EDUCATRICE: [
        'view_enfants', 'update_enfants', 'manage_presences', 'view_emploi_temps',
        'view_menus', 'create_presences', 'update_presences'
      ],
      ASSISTANT: [
        'view_enfants', 'view_presences', 'view_emploi_temps', 'view_menus'
      ]
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission) && !userPermissions.includes('manage_all')) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' requise.`
      });
    }

    next();
  };
};

export default {
  authenticate,
  authorize,
  checkCrecheAccess,
  optionalAuth,
  checkPermission
};