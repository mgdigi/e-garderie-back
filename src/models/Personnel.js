import mongoose from 'mongoose';

const personnelSchema = new mongoose.Schema({
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
  poste: {
    type: String,
    required: [true, 'Le poste est requis'],
    enum: ['DIRECTRICE', 'EDUCATRICE', 'ASSISTANT', 'CUISINIER', 'AGENT_ENTRETIEN', 'GARDIEN'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  adresse: {
    type: String,
    trim: true
  },
  dateEmbauche: {
    type: Date,
    required: [true, 'La date d\'embauche est requise'],
    default: Date.now
  },
  dateDepart: {
    type: Date,
    default: null
  },
  salaire: {
    type: Number,
    required: [true, 'Le salaire est requis'],
    min: [0, 'Le salaire ne peut pas être négatif']
  },
  typeContrat: {
    type: String,
    enum: ['CDI', 'CDD', 'STAGE', 'FREELANCE'],
    required: [true, 'Le type de contrat est requis']
  },
  statut: {
    type: String,
    enum: ['ACTIF', 'INACTIF', 'CONGE', 'SUSPENDU', 'PARTI'],
    default: 'ACTIF'
  },
  
  // Informations bancaires
  informationsBancaires: {
    banque: String,
    numeroCompte: String,
    rib: String
  },

  // Horaires de travail
  horaires: {
    lundi: { debut: String, fin: String, actif: { type: Boolean, default: true } },
    mardi: { debut: String, fin: String, actif: { type: Boolean, default: true } },
    mercredi: { debut: String, fin: String, actif: { type: Boolean, default: true } },
    jeudi: { debut: String, fin: String, actif: { type: Boolean, default: true } },
    vendredi: { debut: String, fin: String, actif: { type: Boolean, default: true } },
    samedi: { debut: String, fin: String, actif: { type: Boolean, default: false } },
    dimanche: { debut: String, fin: String, actif: { type: Boolean, default: false } }
  },

  // Congés et absences
  congesAnnuels: {
    total: { type: Number, default: 30 }, // Jours de congés par an
    utilises: { type: Number, default: 0 },
    restants: { type: Number, default: 30 }
  },

  // Documents
  documents: [{
    nom: String,
    type: String,
    url: String,
    dateUpload: { type: Date, default: Date.now }
  }],

  // Référence à la crèche
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },

  // Référence à l'utilisateur (si le personnel a un compte)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Remarques
  remarques: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'garderie_personnel'  
});

// Index pour optimiser les recherches
personnelSchema.index({ nom: 1, prenom: 1 });
personnelSchema.index({ crecheId: 1 });
personnelSchema.index({ poste: 1 });
personnelSchema.index({ statut: 1 });

// Méthode virtuelle pour le nom complet
personnelSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Méthode pour calculer l'ancienneté
personnelSchema.virtual('anciennete').get(function() {
  const today = new Date();
  const embauche = new Date(this.dateEmbauche);
  const diffTime = Math.abs(today - embauche);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  return { years, months, days: diffDays };
});

// Middleware pour mettre à jour les congés restants
personnelSchema.pre('save', function(next) {
  if (this.congesAnnuels) {
    this.congesAnnuels.restants = this.congesAnnuels.total - this.congesAnnuels.utilises;
  }
  next();
});

export default mongoose.model('Personnel', personnelSchema);