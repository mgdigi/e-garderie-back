import mongoose from 'mongoose';

const urgenceSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  lien: {
    type: String,
    enum: ['PERE', 'MERE', 'GRAND_PARENT', 'ONCLE', 'TANTE', 'TUTEUR', 'AUTRE'],
    required: [true, 'Le lien familial est requis']
  },
  adresse: {
    type: String,
    trim: true
  },
  estContactPrincipal: {
    type: Boolean,
    default: false
  },
  autorisationSortie: {
    type: Boolean,
    default: true
  },
  autorisationSoins: {
    type: Boolean,
    default: true
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
  collection: 'garderie_urgences'
});

// Index pour optimiser les recherches
urgenceSchema.index({ enfantId: 1 });
urgenceSchema.index({ crecheId: 1 });
urgenceSchema.index({ estContactPrincipal: 1 });

export default mongoose.model('Urgence', urgenceSchema);