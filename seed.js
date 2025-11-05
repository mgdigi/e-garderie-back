import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Creche from './src/models/Creche.js';
import Enfant from './src/models/Enfant.js';
import Personnel from './src/models/Personnel.js';
import Facture from './src/models/Facture.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/e-garderie');
    console.log('MongoDB connecté pour le seeding');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Créer la crèche par défaut
    const creche = await Creche.create({
      nom: 'Crèche E-Garderie',
      adresse: 'Dakar, Sénégal',
      telephone: '+221 77 123 45 67',
      email: 'contact@e-garderie.sn',
      capaciteMaximale: 50,
      heuresOuverture: {
        debut: '07:00',
        fin: '18:00'
      },
      joursOuverture: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'],
      tarifs: {
        inscription: 50000,
        mensuel: 150000
      },
      sections: [
        { nom: 'Petite Section', ageMin: 1, ageMax: 3, capacite: 15 },
        { nom: 'Moyenne Section', ageMin: 3, ageMax: 4, capacite: 15 },
        { nom: 'Grande Section', ageMin: 4, ageMax: 6, capacite: 20 }
      ]
    });

    console.log('Crèche créée:', creche.nom);

    // Créer l'utilisateur admin
    const admin = await User.create({
      email: 'admin@e-garderie.sn',
      password: 'admin123',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'E-Garderie',
      phone: '+221 77 123 45 67',
      crecheId: creche._id
    });
console.log('Admin créé:', admin.email);

// Créer du personnel de test
const personnel = await Personnel.create([
  {
    nom: 'Diop',
    prenom: 'Fatou',
    poste: 'Éducatrice',
    telephone: '+221 77 111 11 11',
    email: 'fatou.diop@e-garderie.sn',
    salaire: 200000,
    typeContrat: 'CDI',
    dateEmbauche: new Date('2024-01-15'),
    statut: 'ACTIF',
    crecheId: creche._id
  },
  {
    nom: 'Ndiaye',
    prenom: 'Mamadou',
    poste: 'Éducateur',
    telephone: '+221 77 222 22 22',
    email: 'mamadou.ndiaye@e-garderie.sn',
    salaire: 200000,
    typeContrat: 'CDI',
    dateEmbauche: new Date('2024-02-01'),
    statut: 'ACTIF',
    crecheId: creche._id
  },
  {
    nom: 'Sarr',
    prenom: 'Aminata',
    poste: 'Directrice Adjointe',
    telephone: '+221 77 333 33 33',
    email: 'aminata.sarr@e-garderie.sn',
    salaire: 250000,
    typeContrat: 'CDI',
    dateEmbauche: new Date('2023-09-01'),
    statut: 'ACTIF',
    crecheId: creche._id
  },
  {
    nom: 'Ba',
    prenom: 'Ibrahima',
    poste: 'Agent d\'entretien',
    telephone: '+221 77 444 44 44',
    email: 'ibrahima.ba@e-garderie.sn',
    salaire: 150000,
    typeContrat: 'CDD',
    dateEmbauche: new Date('2024-03-01'),
    statut: 'ACTIF',
    crecheId: creche._id
  },
  {
    nom: 'Gaye',
    prenom: 'Sokhna',
    poste: 'Cuisinière',
    telephone: '+221 77 555 55 55',
    email: 'sokhna.gaye@e-garderie.sn',
    salaire: 180000,
    typeContrat: 'CDI',
    dateEmbauche: new Date('2024-01-01'),
    statut: 'ACTIF',
    crecheId: creche._id
  }
]);

console.log(`${personnel.length} membres du personnel créés`);

// Créer des enfants de test
const enfants = await Enfant.create([
  {
    nom: 'Diallo',
    prenom: 'Amina',
    dateNaissance: new Date('2022-05-15'),
    sexe: 'FEMININ',
    numeroInscription: '2024-0001',
    classeId: null, // Sera défini après création des classes
    dateInscription: new Date('2024-09-01'),
    tarifMensuel: 150000,
    fraisInscription: 50000,
    statut: 'ACTIF',
    crecheId: creche._id,
    parents: [{
      nom: 'Diallo',
      prenom: 'Mamadou',
      relation: 'PERE',
      telephone: '+221 77 666 66 66',
      estContactUrgence: true
    }],
    sante: {
      allergies: ['Arachides'],
      restrictionsAlimentaires: [],
      remarquesMedicales: ''
    }
  },
  {
    nom: 'Sow',
    prenom: 'Omar',
    dateNaissance: new Date('2021-08-20'),
    sexe: 'MASCULIN',
    numeroInscription: '2024-0002',
    classeId: null,
    dateInscription: new Date('2024-09-01'),
    tarifMensuel: 150000,
    fraisInscription: 50000,
    statut: 'ACTIF',
    crecheId: creche._id,
    parents: [{
      nom: 'Sow',
      prenom: 'Fatima',
      relation: 'MERE',
      telephone: '+221 77 777 77 77',
      estContactUrgence: true
    }],
    sante: {
      allergies: [],
      restrictionsAlimentaires: ['Sans porc'],
      remarquesMedicales: ''
    }
  }
]);

console.log(`${enfants.length} enfants créés`);
   


  } catch (error) {
    console.error('Erreur lors du seeding:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

runSeed();