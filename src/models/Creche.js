import mongoose from 'mongoose';

const crecheSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la crèche est requis'],
    trim: true
  },
  adresse: {
    type: String,
    required: [true, 'L\'adresse est requise'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    trim: true
  },
  logo: {
    type: String, // URL de l'image
    default: null
  },
  couleurTheme: {
    type: String,
    default: '#3B82F6' // Bleu par défaut
  },
  capaciteMaximale: {
    type: Number,
    required: [true, 'La capacité maximale est requise'],
    min: [1, 'La capacité doit être d\'au moins 1 enfant']
  },
  heuresOuverture: {
    debut: {
      type: String,
      required: true,
      default: '07:00'
    },
    fin: {
      type: String,
      required: true,
      default: '18:00'
    }
  },
  joursOuverture: [{
    type: String,
    enum: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']
  }],
  tarifs: {
    inscription: {
      type: Number,
      required: true,
      default: 0
    },
    mensuel: {
      type: Number,
      required: true,
      default: 0
    }
  },
  sections: [{
    nom: {
      type: String,
      required: true
    },
    ageMin: {
      type: Number,
      required: true
    },
    ageMax: {
      type: Number,
      required: true
    },
    capacite: {
      type: Number,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  
});

// Index pour optimiser les recherches
crecheSchema.index({ nom: 1 });
crecheSchema.index({ email: 1 });

export default mongoose.model('Creche', crecheSchema);