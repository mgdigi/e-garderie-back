import mongoose from 'mongoose';

const engagementSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Le parent est requis']
  },
  type: {
    type: String,
    required: [true, 'Le type d\'engagement est requis'],
    enum: [
      'REGLEMENT_INTERIEUR',
      'ENGAGEMENT_FINANCIER',
      'ENGAGEMENT_PARENTAL',
      'AUTORISATION_PHOTOS',
      'ENGAGEMENT_SANTE',
      'ENGAGEMENT_TRANSPORT',
      'AUTRE'
    ]
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu est requis'],
    trim: true
  },
  statut: {
    type: String,
    enum: ['BROUILLON', 'ENVOYE', 'SIGNE', 'REFUSE', 'EXPIRE'],
    default: 'BROUILLON'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateEnvoi: {
    type: Date,
    default: null
  },
  dateSignature: {
    type: Date,
    default: null
  },
  dateExpiration: {
    type: Date,
    default: null
  },
  signatureParent: {
    signature: String, // URL de l'image de signature
    dateSignature: Date,
    ipAdresse: String,
    userAgent: String
  },
  signatureCreche: {
    signature: String, // URL de l'image de signature
    dateSignature: Date,
    signePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  conditions: [{
    type: String,
    trim: true
  }],
  documentsAssocies: [{
    nom: String,
    type: String,
    url: String,
    dateUpload: { type: Date, default: Date.now }
  }],
  rappelAutomatique: {
    type: Boolean,
    default: true
  },
  joursRappel: {
    type: Number,
    default: 7,
    min: 1,
    max: 30
  },
  remarques: {
    type: String,
    trim: true
  },
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  }
}, {
  timestamps: true,
  collection: 'garderie_engagements'
});

// Index pour optimiser les recherches
engagementSchema.index({ enfantId: 1 });
engagementSchema.index({ parentId: 1 });
engagementSchema.index({ crecheId: 1 });
engagementSchema.index({ type: 1 });
engagementSchema.index({ statut: 1 });
engagementSchema.index({ dateExpiration: 1 });

// Middleware pour gérer l'expiration automatique
engagementSchema.pre('save', function(next) {
  if (this.dateExpiration && this.dateExpiration < new Date() && this.statut === 'ENVOYE') {
    this.statut = 'EXPIRE';
  }
  next();
});

// Méthode pour vérifier si l'engagement est expiré
engagementSchema.methods.estExpire = function() {
  return this.dateExpiration && this.dateExpiration < new Date();
};

// Méthode pour vérifier si l'engagement est signé
engagementSchema.methods.estSigne = function() {
  return this.statut === 'SIGNE' && this.signatureParent && this.signatureCreche;
};

export default mongoose.model('Engagement', engagementSchema);