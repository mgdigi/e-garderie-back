import mongoose from 'mongoose';

const classeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la classe est requis'],
    trim: true
  },
  capacite: {
    type: Number,
    required: [true, 'La capacité est requise'],
    min: [1, 'La capacité doit être d\'au moins 1 enfant']
  },
  ageMin: {
    type: Number,
    required: [true, 'L\'âge minimum est requis'],
    min: [0, 'L\'âge minimum ne peut pas être négatif']
  },
  ageMax: {
    type: Number,
    required: [true, 'L\'âge maximum est requis'],
    min: [0, 'L\'âge maximum ne peut pas être négatif']
  },
  description: {
    type: String,
    trim: true
  },
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'garderie_classes'
});

// Validation personnalisée pour s'assurer que ageMin < ageMax
classeSchema.pre('validate', function(next) {
  if (this.ageMin >= this.ageMax) {
    this.invalidate('ageMax', 'L\'âge maximum doit être supérieur à l\'âge minimum');
  }
  next();
});

// Index pour optimiser les recherches
classeSchema.index({ crecheId: 1, nom: 1 });
classeSchema.index({ crecheId: 1, isActive: 1 });

export default mongoose.model('Classe', classeSchema);