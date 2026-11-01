import { body, param, query } from 'express-validator';

export const createModuleValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Le titre doit contenir entre 3 et 150 caractères'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description max 2000 caractères'),
  body('duration_weeks')
    .isInt({ min: 1, max: 104 })
    .withMessage('Durée : entier entre 1 et 104 semaines')
    .toInt(),
  body('frequency_per_week')
    .isInt({ min: 1, max: 7 })
    .withMessage('Fréquence : entier entre 1 et 7 fois par semaine')
    .toInt(),
  body('start_date')
    .optional({ nullable: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date de début au format YYYY-MM-DD'),
];

export const updateModuleValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('title').optional().trim().isLength({ min: 3, max: 150 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  body('duration_weeks').optional().isInt({ min: 1, max: 104 }).toInt(),
  body('frequency_per_week').optional().isInt({ min: 1, max: 7 }).toInt(),
];

export const moduleIdValidator = [param('id').isInt({ min: 1 }).toInt()];

export const listModulesValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().isLength({ max: 100 }),
];

export const regenerateSessionsValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('start_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date au format YYYY-MM-DD requise'),
];