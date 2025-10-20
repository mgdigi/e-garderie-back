import Facture from '../models/Facture.js';
import Enfant from '../models/Enfant.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// @desc    Obtenir toutes les factures
// @route   GET /api/factures
// @access  Private
export const getFactures = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { statut, enfantId, mois, annee, search } = req.query;

    let query = { crecheId };

    // Filtres
    if (statut) query.statut = statut;
    if (enfantId) query.enfantId = enfantId;
    if (mois) query.mois = parseInt(mois);
    if (annee) query.annee = parseInt(annee);

    // Recherche par enfant
    if (search) {
      const enfants = await Enfant.find({
        crecheId,
        $or: [
          { nom: { $regex: search, $options: 'i' } },
          { prenom: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.enfantId = { $in: enfants.map(e => e._id) };
    }

    const factures = await Facture.find(query)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('paiementValidePar', 'firstName lastName')
      .sort({ annee: -1, mois: -1, createdAt: -1 });

    res.json({
      success: true,
      data: factures,
      count: factures.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
};

// @desc    Créer une facture
// @route   POST /api/factures
// @access  Private
export const createFacture = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const {
      enfantId,
      mois,
      annee,
      montant,
      type,
      description
    } = req.body;

    // Vérifier que l'enfant existe
    const enfant = await Enfant.findOne({ _id: enfantId, crecheId });
    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    const facture = new Facture({
      enfantId,
      mois,
      annee,
      montant,
      type: type || 'MENSUALITE',
      description,
      crecheId
    });

    await facture.save();

    const factureWithDetails = await Facture.findById(facture._id)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('paiementValidePar', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      data: factureWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message
    });
  }
};

// @desc    Valider un paiement
// @route   POST /api/factures/:id/validate
// @access  Private (Admin/Comptable)
export const validatePaiement = async (req, res) => {
  try {
    const crecheId = req.user.crecheId._id;
    const { modePaiement } = req.body;

    const facture = await Facture.findOne({
      _id: req.params.id,
      crecheId
    }).populate('enfantId', 'nom prenom numeroInscription');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    if (facture.statut === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà payée'
      });
    }

    // Générer le reçu PDF
    const numeroRecu = await Facture.genererNumeroFacture(crecheId);
    const recuUrl = await generateRecuPDF(facture, numeroRecu, req.user);

    // Mettre à jour la facture
    facture.statut = 'PAID';
    facture.datePaiement = new Date();
    facture.modePaiement = modePaiement;
    facture.paiementValidePar = req.user._id;
    facture.recuUrl = recuUrl;

    await facture.save();

    const factureWithDetails = await Facture.findById(facture._id)
      .populate('enfantId', 'nom prenom numeroInscription')
      .populate('paiementValidePar', 'firstName lastName');

    res.json({
      success: true,
      message: 'Paiement validé avec succès',
      data: factureWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la validation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du paiement',
      error: error.message
    });
  }
};

// Fonction pour générer le PDF du reçu
const generateRecuPDF = async (facture, numeroRecu, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `recu_${numeroRecu}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'recus', fileName);

      // Créer le dossier s'il n'existe pas
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // En-tête
      doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
      doc.moveDown();

      // Informations de la crèche
      doc.fontSize(12).text('Crèche E-Garderie', { align: 'center' });
      doc.text('Adresse: Dakar, Sénégal', { align: 'center' });
      doc.text('Téléphone: +221 XX XXX XX XX', { align: 'center' });
      doc.moveDown();

      // Numéro de reçu
      doc.fontSize(14).text(`Numéro de reçu: ${numeroRecu}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown();

      // Informations de l'enfant
      doc.fontSize(12);
      doc.text(`Enfant: ${facture.enfantId.nom} ${facture.enfantId.prenom}`);
      doc.text(`Numéro d'inscription: ${facture.enfantId.numeroInscription}`);
      doc.moveDown();

      // Détails du paiement
      doc.text(`Période: ${facture.mois}/${facture.annee}`);
      doc.text(`Montant payé: ${facture.montant.toLocaleString()} XAF`);
      doc.text(`Mode de paiement: ${facture.modePaiement}`);
      doc.text(`Type: ${facture.type}`);
      doc.moveDown();

      // Validation
      doc.text(`Validé par: ${user.firstName} ${user.lastName}`);
      doc.text(`Date de validation: ${new Date().toLocaleDateString('fr-FR')}`);
      doc.moveDown(2);

      // Signature
      doc.text('Signature:', { align: 'right' });
      doc.moveDown(2);

      // Pied de page
      doc.fontSize(10).text('Ce reçu est généré automatiquement et fait office de justificatif officiel.', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/recus/${fileName}`);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  getFactures,
  createFacture,
  validatePaiement
};