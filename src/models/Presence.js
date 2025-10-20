import mongoose from 'mongoose';

const presenceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    index: true
  },
  
  // Type de présence (enfant ou personnel)
  type: {
    type: String,
    enum: ['ENFANT', 'PERSONNEL'],
    required: [true, 'Le type est requis']
  },

  // Référence vers l'enfant ou le personnel
  enfantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enfant',
    required: function() { return this.type === 'ENFANT'; }
  },
  personnelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: function() { return this.type === 'PERSONNEL'; }
  },

  // Statut de présence
  statut: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'RETARD', 'CONGE', 'MALADIE', 'ABSENCE_JUSTIFIEE', 'ABSENCE_INJUSTIFIEE'],
    required: [true, 'Le statut est requis']
  },

  // Horaires pour le personnel
  heureArrivee: {
    type: String, // Format HH:MM
    required: function() { 
      return this.type === 'PERSONNEL' && ['PRESENT', 'RETARD'].includes(this.statut); 
    }
  },
  heureDepart: {
    type: String, // Format HH:MM
    default: null
  },

  // Heures travaillées (calculées automatiquement)
  heuresTravaillees: {
    type: Number,
    default: 0
  },

  // Remarques
  remarques: {
    type: String,
    trim: true
  },

  // Justificatif pour les absences
  justificatif: {
    type: String, // URL du document
    default: null
  },

  // Référence à la crèche
  crecheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true
  },

  // Utilisateur qui a enregistré la présence
  enregistrePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'garderie_presence'
});

// Index composés pour optimiser les recherches
presenceSchema.index({ date: 1, crecheId: 1 });
presenceSchema.index({ enfantId: 1, date: 1 });
presenceSchema.index({ personnelId: 1, date: 1 });
presenceSchema.index({ type: 1, statut: 1 });

// Index unique pour éviter les doublons
presenceSchema.index({ 
  date: 1, 
  enfantId: 1, 
  personnelId: 1 
}, { 
  unique: true,
  partialFilterExpression: {
    $or: [
      { enfantId: { $exists: true } },
      { personnelId: { $exists: true } }
    ]
  }
});

// Méthode pour calculer les heures travaillées
presenceSchema.methods.calculerHeuresTravaillees = function() {
  if (this.type === 'PERSONNEL' && this.heureArrivee && this.heureDepart) {
    const [heureA, minuteA] = this.heureArrivee.split(':').map(Number);
    const [heureD, minuteD] = this.heureDepart.split(':').map(Number);
    
    const arrivee = heureA * 60 + minuteA;
    const depart = heureD * 60 + minuteD;
    
    let duree = depart - arrivee;
    if (duree < 0) duree += 24 * 60; // Gestion du passage à minuit
    
    this.heuresTravaillees = duree / 60; // Conversion en heures
  }
  return this.heuresTravaillees;
};

// Middleware pour calculer automatiquement les heures travaillées
presenceSchema.pre('save', function(next) {
  if (this.type === 'PERSONNEL' && this.heureArrivee && this.heureDepart) {
    this.calculerHeuresTravaillees();
  }
  next();
});

// Méthodes statiques pour les statistiques
presenceSchema.statics.getStatistiquesPresence = async function(crecheId, dateDebut, dateFin) {
  const pipeline = [
    {
      $match: {
        crecheId: new mongoose.Types.ObjectId(crecheId),
        date: { $gte: dateDebut, $lte: dateFin }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          statut: '$statut'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        statistiques: {
          $push: {
            statut: '$_id.statut',
            count: '$count'
          }
        }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

presenceSchema.statics.getTauxPresence = async function(crecheId, dateDebut, dateFin, type = 'ENFANT') {
  const totalPresences = await this.countDocuments({
    crecheId,
    type,
    date: { $gte: dateDebut, $lte: dateFin }
  });

  const presencesEffectives = await this.countDocuments({
    crecheId,
    type,
    statut: 'PRESENT',
    date: { $gte: dateDebut, $lte: dateFin }
  });

  return totalPresences > 0 ? (presencesEffectives / totalPresences) * 100 : 0;
};

export default mongoose.model('Presence', presenceSchema);