import { body } from 'express-validator';

export const registerLearnerValidator = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom complet doit contenir entre 2 et 100 caractères'),
  body('birth_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('La date de naissance doit être au format YYYY-MM-DD')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime()) || date > new Date()) {
        throw new Error('Date de naissance invalide');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir une minuscule')
    .matches(/\d/).withMessage('Le mot de passe doit contenir un chiffre'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];