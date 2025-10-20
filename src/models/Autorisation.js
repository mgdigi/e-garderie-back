import mongoose from 'mongoose';

const autorisationSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  type: {
    type: String,
    required: [true, 'Le type d\'autorisation est requis'],
    enum: [
      'SORTIE_AUTONOME',
      'SOINS_MEDICAUX',
      'PHOTOS_PUBLICATION',
      'TRANSPORT_SCOLAIRE',
      'ACTIVITES_EXTRA',
      'CONTACTS_URGENCE',
      'ADMINISTRATION_MEDICAMENTS',
      'SORTIE_EXCEPTIONNELLE',
      'AUTRE'
    ]
  },
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'APPROUVEE', 'REFUSEE', 'EXPIREE'],
    default: 'EN_ATTENTE'
  },
  dateDemande: {
    type: Date,
    default: Date.now
  },
  dateValidation: {
    type: Date,
    default: null
  },
  dateExpiration: {
    type: Date,
    default: null
  },
  validePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  conditions: [{
    type: String,
    trim: true
  }],
  documents: [{
    nom: String,
    type: String,
    url: String,
    dateUpload: { type: Date, default: Date.now }
  }],
  renouvellementAutomatique: {
    type: Boolean,
    default: false
  },
  frequenceRenouvellement: {
    type: String,
    enum: ['MENSUEL', 'TRIMESTRIEL', 'ANNUEL', 'PONCTUEL'],
    default: 'ANNUEL'
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
  collection: 'garderie_autorisations'
});

// Index pour optimiser les recherches
autorisationSchema.index({ enfantId: 1 });
autorisationSchema.index({ crecheId: 1 });
autorisationSchema.index({ type: 1 });
autorisationSchema.index({ statut: 1 });
autorisationSchema.index({ dateExpiration: 1 });

// Middleware pour gérer l'expiration automatique
autorisationSchema.pre('save', function(next) {
  if (this.dateExpiration && this.dateExpiration < new Date() && this.statut === 'APPROUVEE') {
    this.statut = 'EXPIREE';
  }
  next();
});

export default mongoose.model('Autorisation', autorisationSchema);