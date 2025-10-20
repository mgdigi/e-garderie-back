import mongoose from 'mongoose';

const paiementSchema = new mongoose.Schema({
  // Type de transaction
  type: {
    type: String,
    enum: ['RECETTE', 'DEPENSE'],
    required: [true, 'Le type est requis']
  },

  // Catégorie
  categorie: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: [
        // Recettes
        'FRAIS_INSCRIPTION', 'MENSUALITE', 'FRAIS_RETARD', 'AUTRES_RECETTES',
        // Dépenses
        'SALAIRES', 'FOURNITURES', 'ALIMENTATION', 'ENTRETIEN', 'ELECTRICITE', 
        'EAU', 'TELEPHONE', 'INTERNET', 'ASSURANCE', 'LOYER', 'TRANSPORT', 'AUTRES_DEPENSES'
      ],
      message: 'Catégorie non valide'
    }
  },

  // Montant
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant ne peut pas être négatif']
  },

  // Description
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },

  // Date de la transaction
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },

  // Méthode de paiement
  methodePaiement: {
    type: String,
    enum: ['ESPECES', 'VIREMENT', 'CHEQUE', 'ORANGE_MONEY', 'WAVE', 'CARTE_BANCAIRE'],
    required: [true, 'La méthode de paiement est requise']
  },

  // Référence (numéro de chèque, référence virement, etc.)
  reference: {
    type: String,
    trim: true
  },

  // Pour les recettes liées aux enfants
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: function() { 
      return this.type === 'RECETTE' && ['FRAIS_INSCRIPTION', 'MENSUALITE', 'FRAIS_RETARD'].includes(this.categorie); 
    }
  },

  // Pour les dépenses liées au personnel
  personnelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: function() { 
      return this.type === 'DEPENSE' && this.categorie === 'SALAIRES'; 
    }
  },

  // Période concernée (pour les mensualités)
  periode: {
    mois: {
      type: Number,
      min: 1,
      max: 12
    },
    annee: {
      type: Number,
      min: 2020
    }
  },

  // Statut du paiement
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'PAYE', 'PARTIEL', 'ANNULE'],
    default: 'PAYE'
  },

  // Montant payé (pour les paiements partiels)
  montantPaye: {
    type: Number,
    default: function() { return this.montant; },
    min: [0, 'Le montant payé ne peut pas être négatif']
  },

  // Documents associés (reçu, facture, etc.)
  documents: [{
    nom: String,
    type: String, // 'RECU', 'FACTURE', 'JUSTIFICATIF'
    url: String,
    dateUpload: { type: Date, default: Date.now }
  }],

  // Référence à la crèche
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },

  // Utilisateur qui a enregistré le paiement
  enregistrePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Remarques
  remarques: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'garderie_paiements'
});

// Index pour optimiser les recherches
paiementSchema.index({ date: 1, crecheId: 1 });
paiementSchema.index({ type: 1, categorie: 1 });
paiementSchema.index({ enfantId: 1, date: 1 });
paiementSchema.index({ personnelId: 1, date: 1 });
paiementSchema.index({ 'periode.mois': 1, 'periode.annee': 1 });

// Méthode virtuelle pour le montant restant
paiementSchema.virtual('montantRestant').get(function() {
  return this.montant - this.montantPaye;
});

// Méthode pour générer un numéro de reçu
paiementSchema.statics.genererNumeroRecu = async function(crecheId) {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ 
    crecheId,
    type: 'RECETTE',
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  return `REC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Méthode pour générer un numéro de facture
paiementSchema.statics.genererNumeroFacture = async function(crecheId) {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ 
    crecheId,
    type: 'DEPENSE',
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Méthodes statiques pour les rapports financiers
paiementSchema.statics.getRapportMensuel = async function(crecheId, mois, annee) {
  const dateDebut = new Date(annee, mois - 1, 1);
  const dateFin = new Date(annee, mois, 0, 23, 59, 59);

  const pipeline = [
    {
      $match: {
        crecheId: new mongoose.Types.ObjectId(crecheId),
        date: { $gte: dateDebut, $lte: dateFin },
        statut: { $ne: 'ANNULE' }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          categorie: '$categorie'
        },
        total: { $sum: '$montantPaye' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            categorie: '$_id.categorie',
            total: '$total',
            count: '$count'
          }
        },
        totalType: { $sum: '$total' }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

paiementSchema.statics.getSolde = async function(crecheId, dateDebut, dateFin) {
  const recettes = await this.aggregate([
    {
      $match: {
        crecheId: new mongoose.Types.ObjectId(crecheId),
        type: 'RECETTE',
        date: { $gte: dateDebut, $lte: dateFin },
        statut: { $ne: 'ANNULE' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$montantPaye' }
      }
    }
  ]);

  const depenses = await this.aggregate([
    {
      $match: {
        crecheId: new mongoose.Types.ObjectId(crecheId),
        type: 'DEPENSE',
        date: { $gte: dateDebut, $lte: dateFin },
        statut: { $ne: 'ANNULE' }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$montantPaye' }
      }
    }
  ]);

  const totalRecettes = recettes.length > 0 ? recettes[0].total : 0;
  const totalDepenses = depenses.length > 0 ? depenses[0].total : 0;

  return {
    recettes: totalRecettes,
    depenses: totalDepenses,
    solde: totalRecettes - totalDepenses
  };
};

export default mongoose.model('Paiement', paiementSchema);