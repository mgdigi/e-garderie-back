import mongoose from 'mongoose';

const emploiDuTempsSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de l\'emploi du temps est requis'],
    trim: true
  },
  
  section: {
    type: String,
    required: [true, 'La section est requise'],
    enum: ['BEBES', 'MOYENS', 'GRANDS', 'TOUTES']
  },

  // Semaine de référence
  semaine: {
    debut: {
      type: Date,
      required: [true, 'La date de début est requise']
    },
    fin: {
      type: Date,
      required: [true, 'La date de fin est requise']
    }
  },

  // Planning hebdomadaire
  planning: {
    lundi: [{
      heureDebut: {
        type: String,
        required: true
      },
      heureFin: {
        type: String,
        required: true
      },
      activite: {
        type: String,
        required: true,
        enum: [
          'ACCUEIL', 'PETIT_DEJEUNER', 'ACTIVITE_PEDAGOGIQUE', 'JEU_LIBRE',
          'SIESTE', 'DEJEUNER', 'GOUTER', 'ACTIVITE_MOTRICE', 'LECTURE',
          'CHANT', 'DESSIN', 'SORTIE', 'HYGIENE', 'DEPART'
        ]
      },
      description: {
        type: String,
        trim: true
      },
      educatriceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Personnel'
      },
      lieu: {
        type: String,
        trim: true
      }
    }],
    mardi: [{
      heureDebut: String,
      heureFin: String,
      activite: String,
      description: String,
      educatriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' },
      lieu: String
    }],
    mercredi: [{
      heureDebut: String,
      heureFin: String,
      activite: String,
      description: String,
      educatriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' },
      lieu: String
    }],
    jeudi: [{
      heureDebut: String,
      heureFin: String,
      activite: String,
      description: String,
      educatriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' },
      lieu: String
    }],
    vendredi: [{
      heureDebut: String,
      heureFin: String,
      activite: String,
      description: String,
      educatriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' },
      lieu: String
    }],
    samedi: [{
      heureDebut: String,
      heureFin: String,
      activite: String,
      description: String,
      educatriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personnel' },
      lieu: String
    }]
  },

  // Statut
  statut: {
    type: String,
    enum: ['BROUILLON', 'ACTIF', 'ARCHIVE'],
    default: 'BROUILLON'
  },

  // Référence à la crèche
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },

  // Créé par
  creePar: {
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
  collection: 'garderie_emplois_du_temps'
});

// Index pour optimiser les recherches
emploiDuTempsSchema.index({ crecheId: 1, section: 1 });
emploiDuTempsSchema.index({ 'semaine.debut': 1, 'semaine.fin': 1 });
emploiDuTempsSchema.index({ statut: 1 });

// Méthode pour dupliquer un emploi du temps
emploiDuTempsSchema.methods.dupliquer = function(nouvelleSemaine) {
  const nouvelEmploi = this.toObject();
  delete nouvelEmploi._id;
  delete nouvelEmploi.createdAt;
  delete nouvelEmploi.updatedAt;
  
  nouvelEmploi.semaine = nouvelleSemaine;
  nouvelEmploi.nom = `${this.nom} - Copie`;
  nouvelEmploi.statut = 'BROUILLON';
  
  return new this.constructor(nouvelEmploi);
};

export default mongoose.model('EmploiDuTemps', emploiDuTempsSchema);