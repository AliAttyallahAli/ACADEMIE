import { body, param, query } from 'express-validator';

const TYPES = ['formation', 'recherche', 'stage', 'autre'];
const STATUSES = ['draft', 'published', 'closed'];

export const createScholarshipValidator = [
  body('type').isIn(TYPES).withMessage('Type invalide'),
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('description').optional().isString(),
  body('organization').optional().trim().isLength({ max: 200 }),
  body('amount').optional().isString().isLength({ max: 100 }),
  body('opening_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('closing_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('required_documents').optional().isArray(),
  body('required_documents.*.name').optional().isString(),
  body('eligibility').optional().isString(),
  body('status').optional().isIn(STATUSES),
];

export const updateScholarshipValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('type').optional().isIn(TYPES),
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('status').optional().isIn(STATUSES),
  body('closing_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
];

export const idParamValidator = [param('id').isInt({ min: 1 }).toInt()];

export const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(STATUSES),
  query('type').optional().isIn(TYPES),
];

export const applyValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('motivation_letter').trim().isLength({ min: 50, max: 2000 })
    .withMessage('Lettre de motivation : 50 à 2000 caractères'),
];

export const reviewApplicationValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('status').isIn(['accepted', 'rejected']),
  body('review_note').optional().trim().isLength({ max: 1000 }),
];