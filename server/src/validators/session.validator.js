import { body, param } from 'express-validator';

export const sessionIdValidator = [param('id').isInt({ min: 1 }).toInt()];
export const moduleIdParamValidator = [param('moduleId').isInt({ min: 1 }).toInt()];

export const updateSessionValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('title').optional().trim().isLength({ min: 1, max: 150 }),
  body('content').optional().isString(),
  body('content_type').optional().isIn(['text', 'video', 'pdf']),
  body('scheduled_date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date au format YYYY-MM-DD'),
];