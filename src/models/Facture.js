import mongoose from 'mongoose';

const factureSchema = new mongoose.Schema({
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: [true, 'L\'enfant est requis']
  },
  mois: {
    type: Number,
    required: [true, 'Le mois est requis'],
    min: 1,
    max: 12
  },
  annee: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: 2020
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  statut: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  datePaiement: {
    type: Date,
    default: null
  },
  modePaiement: {
    type: String,
    enum: ['ESPECES', 'VIREMENT', 'CHEQUE', 'ORANGE_MONEY', 'WAVE', 'CARTE_BANCAIRE'],
    default: null
  },
  paiementValidePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  recuUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['INSCRIPTION', 'MENSUALITE', 'FRAIS_RETARD', 'AUTRES'],
    default: 'MENSUALITE'
  },
  description: {
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
  collection: 'garderie_factures'
});

// Index pour optimiser les recherches
factureSchema.index({ enfantId: 1, mois: 1, annee: 1 });
factureSchema.index({ crecheId: 1 });
factureSchema.index({ statut: 1 });
factureSchema.index({ type: 1 });

// Méthode pour générer un numéro de facture
factureSchema.statics.genererNumeroFacture = async function(crecheId) {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    crecheId,
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });

  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
};

export default mongoose.model('Facture', factureSchema);