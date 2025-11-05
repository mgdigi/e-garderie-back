import mongoose from 'mongoose';

const enfantSchema = new mongoose.Schema({
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
  dateNaissance: {
    type: Date,
    required: [true, 'La date de naissance est requise']
  },
  sexe: {
    type: String,
    enum: ['MASCULIN', 'FEMININ'],
    required: [true, 'Le sexe est requis']
  },
  photo: {
    type: String, 
    default: null
  },
  numeroInscription: {
    type: String,
    required: true
  },
  
  // Informations des parents/tuteurs
  parents: [{
    nom: {
      type: String,
      required: true,
      trim: true
    },
    prenom: {
      type: String,
      required: true,
      trim: true
    },
    relation: {
      type: String,
      enum: ['PERE', 'MERE', 'TUTEUR', 'AUTRE'],
      required: true
    },
    telephone: {
      type: String,
      required: true,
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
    profession: {
      type: String,
      trim: true
    },
    estContactUrgence: {
      type: Boolean,
      default: false
    }
  }],

  // Informations de santé
  sante: {
    allergies: [{
      type: String,
      trim: true
    }],
    restrictionsAlimentaires: [{
      type: String,
      trim: true
    }],
    remarquesMedicales: {
      type: String,
      trim: true
    },
    medicamentsReguliers: [{
      nom: String,
      dosage: String,
      frequence: String,
      instructions: String
    }],
    medecinTraitant: {
      nom: String,
      telephone: String
    }
  },

  // Section/Classe - Référence vers la classe
  classeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe',
    required: [true, 'La classe est requise']
  },

  // Statut et dates
  dateInscription: {
    type: Date,
    default: Date.now
  },
  dateDepart: {
    type: Date,
    default: null
  },
  statut: {
    type: String,
    enum: ['ACTIF', 'INACTIF', 'SUSPENDU', 'PARTI'],
    default: 'ACTIF'
  },

  // Informations financières
  tarifMensuel: {
    type: Number,
    required: [true, 'Le tarif mensuel est requis'],
    min: [0, 'Le tarif ne peut pas être négatif']
  },
  fraisInscription: {
    type: Number,
    default: 0,
    min: [0, 'Les frais ne peuvent pas être négatifs']
  },

  // Référence à la crèche
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },

  // Remarques générales
  remarques: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'garderie_enfants'
});

// Index pour optimiser les recherches
enfantSchema.index({ nom: 1, prenom: 1 });
enfantSchema.index({ numeroInscription: 1 });
enfantSchema.index({ crecheId: 1 });
enfantSchema.index({ classeId: 1 });
enfantSchema.index({ statut: 1 });

// Méthode virtuelle pour calculer l'âge
enfantSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Méthode pour générer un numéro d'inscription unique par crèche
enfantSchema.statics.generateNumeroInscription = async function(crecheId) {
  const year = new Date().getFullYear();

  // Récupérer tous les numéros d'inscription pour cette année et cette crèche
  const enfants = await this.find({
    crecheId,
    numeroInscription: { $regex: `^${year}-` }
  }, { numeroInscription: 1 });

  let maxNumber = 0;
  enfants.forEach(enfant => {
    const num = parseInt(enfant.numeroInscription.split('-')[1]);
    if (num > maxNumber) maxNumber = num;
  });

  const nextNumber = maxNumber + 1;

  return `${year}-${String(nextNumber).padStart(4, '0')}`;
};

export default mongoose.model('Enfant', enfantSchema);