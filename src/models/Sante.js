import mongoose from 'mongoose';

const santeSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  allergies: [{
    aliment: {
      type: String,
      required: true,
      trim: true
    },
    severite: {
      type: String,
      enum: ['LEGERE', 'MODEREE', 'SEVERE'],
      default: 'MODEREE'
    },
    symptomes: {
      type: String,
      trim: true
    },
    traitement: {
      type: String,
      trim: true
    }
  }],
  restrictionsAlimentaires: [{
    type: {
      type: String,
      required: true,
      enum: ['RELIGIEUSE', 'MEDICALE', 'PREFERENCE', 'AUTRE']
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    alimentsInterdits: [{
      type: String,
      trim: true
    }]
  }],
  medicaments: [{
    nom: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequence: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    },
    urgence: {
      type: Boolean,
      default: false
    }
  }],
  conditionsMedicales: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    traitement: {
      type: String,
      trim: true
    },
    medecin: {
      nom: String,
      telephone: String,
      specialite: String
    }
  }],
  vaccinations: [{
    vaccin: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    rappel: {
      type: Date,
      default: null
    },
    statut: {
      type: String,
      enum: ['A_JOUR', 'A_FAIRE', 'EN_RETARD'],
      default: 'A_JOUR'
    }
  }],
  remarquesMedicales: {
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
  collection: 'garderie_sante'
});

// Index pour optimiser les recherches
santeSchema.index({ enfantId: 1 });
santeSchema.index({ crecheId: 1 });
santeSchema.index({ 'allergies.aliment': 1 });

export default mongoose.model('Sante', santeSchema);