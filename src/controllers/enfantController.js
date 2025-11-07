import Enfant from '../models/Enfant.js';
import Paiement from '../models/Paiement.js';


export const getEnfants = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const { statut, section, search } = req.query;

    let query = { crecheId };

    if (statut) query.statut = statut;
    if (section) query.section = section;

    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } }
      ];
    }

    const enfants = await Enfant.find(query)
      .populate('crecheId', 'nom')
      .populate('classeId', 'nom capacite ageMin ageMax')
      .sort({ nom: 1, prenom: 1 });

    res.json({
      success: true,
      data: enfants,
      count: enfants.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des enfants',
      error: error.message
    });
  }
};


export const getEnfant = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const enfant = await Enfant.findOne({
      _id: req.params.id,
      crecheId
    }).populate('crecheId', 'nom')
      .populate('classeId', 'nom capacite ageMin ageMax');

    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    res.json({
      success: true,
      data: enfant
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'enfant',
      error: error.message
    });
  }
};


export const createEnfant = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const {
      nom,
      prenom,
      dateNaissance,
      sexe,
      classeId,
      dateInscription,
      tarifMensuel,
      fraisInscription,
      parentNom,
      parentPrenom,
      parentTelephone,
      parentEmail,
      parentProfession,
      parentRelation,
      adresse,
      allergies,
      restrictionsAlimentaires,
      remarquesMedicales
    } = req.body;

    const numeroInscription = await Enfant.generateNumeroInscription(crecheId);

    const enfant = new Enfant({
      nom,
      prenom,
      dateNaissance,
      sexe: sexe === 'M' ? 'MASCULIN' : 'FEMININ',
      numeroInscription,
      classeId: classeId,
      dateInscription,
      tarifMensuel: tarifMensuel || 150000,
      fraisInscription: fraisInscription || 50000,
      crecheId,
      parents: parentNom ? [{
        nom: parentNom,
        prenom: parentPrenom || '',
        relation: parentRelation || 'PERE',
        telephone: parentTelephone || '',
        email: parentEmail || '',
        adresse: adresse || '',
        profession: parentProfession || '',
        estContactUrgence: true
      }] : [],
      sante: {
        allergies: allergies ? allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        restrictionsAlimentaires: restrictionsAlimentaires ? restrictionsAlimentaires.split(',').map(r => r.trim()).filter(r => r) : [],
        remarquesMedicales: remarquesMedicales || ''
      }
    });

    await enfant.save();

    let paiementInscription = null;
    let factureInscription = null;

    if (fraisInscription && fraisInscription > 0) {
      paiementInscription = new Paiement({
        type: 'RECETTE',
        categorie: 'FRAIS_INSCRIPTION',
        montant: fraisInscription,
        montantPaye: fraisInscription, // Considéré comme payé
        date: new Date(),
        description: `Frais d'inscription pour ${nom} ${prenom}`,
        statut: 'PAYE', // Directement payé
        methodePaiement: 'ESPECES', // Valeur par défaut pour les inscriptions
        enfantId: enfant._id,
        crecheId,
        enregistrePar: req.user._id
      });

      await paiementInscription.save();

      // Créer la facture d'inscription comme payée
      const Facture = (await import('../models/Facture.js')).default;
      const currentDate = new Date();
      const mois = currentDate.getMonth() + 1;
      const annee = currentDate.getFullYear();

      factureInscription = new Facture({
        enfantId: enfant._id,
        mois,
        annee,
        montant: fraisInscription,
        type: 'INSCRIPTION',
        description: `Frais d'inscription pour ${nom} ${prenom}`,
        statut: 'PAID', // Directement payé
        datePaiement: new Date(),
        modePaiement: 'ESPECES',
        paiementValidePar: req.user._id,
        crecheId
      });

      await factureInscription.save();
    }

    const enfantWithCreche = await Enfant.findById(enfant._id)
      .populate('crecheId', 'nom')
      .populate('classeId', 'nom capacite ageMin ageMax');

    res.status(201).json({
      success: true,
      message: 'Enfant créé avec succès',
      data: enfantWithCreche,
      paiementInscription: paiementInscription ? {
        _id: paiementInscription._id,
        montant: paiementInscription.montant,
        statut: paiementInscription.statut,
        type: paiementInscription.type,
        categorie: paiementInscription.categorie
      } : null,
      factureInscription: factureInscription ? {
        _id: factureInscription._id,
        montant: factureInscription.montant,
        statut: factureInscription.statut,
        type: factureInscription.type
      } : null
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'enfant',
      error: error.message
    });
  }
};


export const updateEnfant = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const {
      nom,
      prenom,
      dateNaissance,
      sexe,
      classeId,
      statut,
      tarifMensuel,
      fraisInscription,
      parentNom,
      parentPrenom,
      parentTelephone,
      parentEmail,
      parentProfession,
      parentRelation,
      adresse,
      allergies,
      restrictionsAlimentaires,
      remarquesMedicales
    } = req.body;

    const enfant = await Enfant.findOneAndUpdate(
      { _id: req.params.id, crecheId },
      {
        nom,
        prenom,
        dateNaissance,
        sexe: sexe === 'M' ? 'MASCULIN' : 'FEMININ',
        classeId: classeId,
        statut,
        tarifMensuel,
        fraisInscription,
        parents: parentNom ? [{
          nom: parentNom,
          prenom: parentPrenom || '',
          relation: parentRelation || 'PERE',
          telephone: parentTelephone || '',
          email: parentEmail || '',
          adresse: adresse || '',
          profession: parentProfession || '',
          estContactUrgence: true
        }] : [],
        sante: {
          allergies: allergies ? allergies.split(',').map(a => a.trim()).filter(a => a) : [],
          restrictionsAlimentaires: restrictionsAlimentaires ? restrictionsAlimentaires.split(',').map(r => r.trim()).filter(r => r) : [],
          remarquesMedicales: remarquesMedicales || ''
        }
      },
      { new: true, runValidators: true }
    ).populate('crecheId', 'nom')
      .populate('classeId', 'nom capacite ageMin ageMax');

    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Enfant mis à jour avec succès',
      data: enfant
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'enfant',
      error: error.message
    });
  }
};


export const deleteEnfant = async (req, res) => {
  try {
    const crecheId = req.user.crecheId?._id || req.user.crecheId;
    const enfant = await Enfant.findOneAndDelete({
      _id: req.params.id,
      crecheId
    });

    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: 'Enfant non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Enfant supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'enfant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'enfant',
      error: error.message
    });
  }
};

export default {
  getEnfants,
  getEnfant,
  createEnfant,
  updateEnfant,
  deleteEnfant
};