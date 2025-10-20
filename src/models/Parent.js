import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
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
  sexe: {
    type: String,
    enum: ['MASCULIN', 'FEMININ'],
    required: [true, 'Le sexe est requis']
  },
  profession: {
    type: String,
    trim: true
  },
  lieuTravail: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  lien: {
    type: String,
    enum: ['PERE', 'MERE', 'TUTEUR', 'AUTRE'],
    required: [true, 'Le lien familial est requis']
  },
  adresse: {
    type: String,
    trim: true
  },
  enfants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant'
  }],
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  }
}, {
  timestamps: true,
  collection: 'garderie_parents'
});

// Index pour optimiser les recherches
parentSchema.index({ nom: 1, prenom: 1 });
parentSchema.index({ email: 1 });
parentSchema.index({ telephone: 1 });
parentSchema.index({ crecheId: 1 });

// Méthode virtuelle pour le nom complet
parentSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

export default mongoose.model('Parent', parentSchema);