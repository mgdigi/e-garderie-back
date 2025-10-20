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

    // Créer du personnel
    const personnel = await Personnel.create([
      {
        nom: 'Diop',
        prenom: 'Fatou',
        poste: 'DIRECTRICE',
        telephone: '+221 77 111 11 11',
        email: 'directrice@e-garderie.sn',
        salaire: 300000,
        typeContrat: 'CDI',
        dateEmbauche: new Date('2023-01-15'),
        crecheId: creche._id
      },
      {
        nom: 'Ndiaye',
        prenom: 'Mamadou',
        poste: 'EDUCATRICE',
        telephone: '+221 77 222 22 22',
        email: 'educatrice1@e-garderie.sn',
        salaire: 200000,
        typeContrat: 'CDI',
        dateEmbauche: new Date('2023-02-01'),
        crecheId: creche._id
      },
      {
        nom: 'Sarr',
        prenom: 'Aminata',
        poste: 'CUISINIER',
        telephone: '+221 77 333 33 33',
        email: 'cuisinier@e-garderie.sn',
        salaire: 180000,
        typeContrat: 'CDI',
        dateEmbauche: new Date('2023-03-01'),
        crecheId: creche._id
      }
    ]);

    console.log('Personnel créé:', personnel.length, 'membres');

    // Créer des enfants avec leurs parents
    const enfants = await Enfant.create([
      {
        nom: 'Ba',
        prenom: 'Amadou',
        dateNaissance: new Date('2021-05-15'),
        sexe: 'MASCULIN',
        numeroInscription: '2024-001',
        section: 'MOYENS',
        tarifMensuel: 150000,
        fraisInscription: 50000,
        parents: [{
          nom: 'Ba',
          prenom: 'Papa',
          relation: 'PERE',
          telephone: '+221 77 444 44 44',
          email: 'papa.ba@email.com',
          adresse: 'Dakar, Sénégal',
          estContactUrgence: true
        }],
        crecheId: creche._id
      },
      {
        nom: 'Diallo',
        prenom: 'Aïcha',
        dateNaissance: new Date('2020-08-20'),
        sexe: 'FEMININ',
        numeroInscription: '2024-002',
        section: 'GRANDS',
        tarifMensuel: 150000,
        fraisInscription: 50000,
        parents: [{
          nom: 'Diallo',
          prenom: 'Maman',
          relation: 'MERE',
          telephone: '+221 77 555 55 55',
          email: 'maman.diallo@email.com',
          adresse: 'Dakar, Sénégal',
          estContactUrgence: true
        }],
        crecheId: creche._id
      },
      {
        nom: 'Sow',
        prenom: 'Oumar',
        dateNaissance: new Date('2022-12-10'),
        sexe: 'MASCULIN',
        numeroInscription: '2024-003',
        section: 'BEBES',
        tarifMensuel: 150000,
        fraisInscription: 50000,
        parents: [{
          nom: 'Sow',
          prenom: 'Papa',
          relation: 'PERE',
          telephone: '+221 77 666 66 66',
          email: 'papa.sow@email.com',
          adresse: 'Dakar, Sénégal',
          estContactUrgence: true
        }],
        crecheId: creche._id
      }
    ]);

    console.log('Enfants créés:', enfants.length);

    // Créer des factures pour les enfants
    const factures = await Facture.create([
      {
        enfantId: enfants[0]._id,
        mois: 10,
        annee: 2024,
        montant: 150000,
        type: 'MENSUALITE',
        description: 'Mensualité octobre 2024',
        crecheId: creche._id
      },
      {
        enfantId: enfants[1]._id,
        mois: 10,
        annee: 2024,
        montant: 150000,
        type: 'MENSUALITE',
        description: 'Mensualité octobre 2024',
        crecheId: creche._id
      },
      {
        enfantId: enfants[2]._id,
        mois: 10,
        annee: 2024,
        montant: 150000,
        type: 'MENSUALITE',
        description: 'Mensualité octobre 2024',
        crecheId: creche._id
      }
    ]);

    console.log('Factures créées:', factures.length);

    console.log('\n=== DONNÉES DE TEST CRÉÉES ===');
    console.log('Crèche:', creche.nom);
    console.log('Admin: admin@e-garderie.sn / admin123');
    console.log('Personnel:', personnel.length, 'membres');
    console.log('Enfants:', enfants.length);
    console.log('Factures:', factures.length);
    console.log('\n=== SEEDING TERMINÉ ===');

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