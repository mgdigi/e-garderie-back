import mongoose from 'mongoose';

const habitudeSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  sommeil: {
    heureCoucher: {
      type: String,
      trim: true
    },
    heureReveil: {
      type: String,
      trim: true
    },
    dureeSommeil: {
      type: String,
      trim: true
    },
    qualiteSommeil: {
      type: String,
      enum: ['EXCELLENTE', 'BONNE', 'MOYENNE', 'DIFFICILE'],
      default: 'BONNE'
    },
    rituelsCoucher: [{
      type: String,
      trim: true
    }]
  },
  alimentation: {
    preferences: [{
      type: String,
      trim: true
    }],
    aversions: [{
      type: String,
      trim: true
    }],
    rythmeRepas: {
      type: String,
      enum: ['REGULIER', 'IRREGULIER', 'SELON_APPETIT'],
      default: 'REGULIER'
    },
    habitudesBoisson: [{
      type: String,
      trim: true
    }]
  },
  hygiene: {
    autonomie: {
      type: String,
      enum: ['TOTALE', 'PARTIELLE', 'ACCOMPAGNEMENT'],
      default: 'PARTIELLE'
    },
    habitudesToilette: [{
      type: String,
      trim: true
    }],
    produitsHygiene: [{
      type: String,
      trim: true
    }]
  },
  comportement: {
    temperament: {
      type: String,
      enum: ['CALME', 'ACTIF', 'TIMIDE', 'SOCIABLE', 'EMOTIF'],
      default: 'SOCIABLE'
    },
    reactionsStress: [{
      type: String,
      trim: true
    }],
    strategiesApaisement: [{
      type: String,
      trim: true
    }],
    interactions: {
      type: String,
      enum: ['FACILE', 'DIFFICILE', 'SELECTIF', 'RESERVE'],
      default: 'FACILE'
    }
  },
  apprentissage: {
    styleApprentissage: {
      type: String,
      enum: ['VISUEL', 'AUDITIF', 'KINESTHESIQUE', 'MIXTE'],
      default: 'MIXTE'
    },
    centresInteret: [{
      type: String,
      trim: true
    }],
    niveauConcentration: {
      type: String,
      enum: ['TRES_BON', 'BON', 'MOYEN', 'DIFFICILE'],
      default: 'BON'
    }
  },
  remarquesGenerales: {
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
  collection: 'garderie_habitudes'
});

// Index pour optimiser les recherches
habitudeSchema.index({ enfantId: 1 });
habitudeSchema.index({ crecheId: 1 });

export default mongoose.model('Habitude', habitudeSchema);