import { body } from 'express-validator';

export const updateProfileValidator = [
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('country').optional().trim().isLength({ max: 60 }),
  body('bio').optional().trim().isLength({ max: 500 }),
];

export const changePasswordValidator = [
  body('current_password').notEmpty().withMessage('Mot de passe actuel requis'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Nouveau mot de passe : minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
    .matches(/[a-z]/).withMessage('Au moins une minuscule')
    .matches(/\d/).withMessage('Au moins un chiffre'),
];