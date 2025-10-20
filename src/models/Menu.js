import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du menu est requis'],
    trim: true
  },

  // Type de menu
  type: {
    type: String,
    enum: ['HEBDOMADAIRE', 'MENSUEL'],
    required: [true, 'Le type de menu est requis']
  },

  // Période couverte
  periode: {
    debut: {
      type: Date,
      required: [true, 'La date de début est requise']
    },
    fin: {
      type: Date,
      required: [true, 'La date de fin est requise']
    }
  },

  // Menu hebdomadaire
  menuHebdomadaire: {
    lundi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    },
    mardi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    },
    mercredi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    },
    jeudi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    },
    vendredi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    },
    samedi: {
      petitDejeuner: {
        plats: [String],
        allergenes: [String],
        remarques: String
      },
      dejeuner: {
        entree: String,
        platPrincipal: String,
        accompagnement: String,
        dessert: String,
        allergenes: [String],
        remarques: String
      },
      gouter: {
        plats: [String],
        allergenes: [String],
        remarques: String
      }
    }
  },

  // Régimes spéciaux
  regimesSpeciaux: [{
    nom: {
      type: String,
      required: true
    },
    description: String,
    menuAlternatif: {
      type: mongoose.Schema.Types.Mixed // Structure similaire au menu principal
    }
  }],

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

  // Remarques générales
  remarques: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'garderie_menus'
});

// Index pour optimiser les recherches
menuSchema.index({ crecheId: 1 });
menuSchema.index({ 'periode.debut': 1, 'periode.fin': 1 });
menuSchema.index({ statut: 1 });

// Méthode pour obtenir le menu d'un jour spécifique
menuSchema.methods.getMenuDuJour = function(date) {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jourSemaine = jours[date.getDay()];
  
  if (jourSemaine === 'dimanche') {
    return null; // Pas de menu le dimanche par défaut
  }
  
  return this.menuHebdomadaire[jourSemaine] || null;
};

// Méthode pour dupliquer un menu
menuSchema.methods.dupliquer = function(nouvellePeriode) {
  const nouveauMenu = this.toObject();
  delete nouveauMenu._id;
  delete nouveauMenu.createdAt;
  delete nouveauMenu.updatedAt;
  
  nouveauMenu.periode = nouvellePeriode;
  nouveauMenu.nom = `${this.nom} - Copie`;
  nouveauMenu.statut = 'BROUILLON';
  
  return new this.constructor(nouveauMenu);
};

// Méthode statique pour obtenir les allergènes utilisés
menuSchema.statics.getAllergenes = function() {
  return [
    'GLUTEN', 'LACTOSE', 'OEUFS', 'ARACHIDES', 'FRUITS_A_COQUE',
    'SOJA', 'POISSON', 'CRUSTACES', 'MOLLUSQUES', 'CELERI',
    'MOUTARDE', 'SESAME', 'SULFITES', 'LUPIN'
  ];
};

export default mongoose.model('Menu', menuSchema);