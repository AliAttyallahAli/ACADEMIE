import { body, param } from 'express-validator';

export const sessionIdParamValidator = [param('sessionId').isInt({ min: 1 }).toInt()];

export const upsertQuizValidator = [
  param('sessionId').isInt({ min: 1 }).toInt(),
  body('pass_threshold').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('max_attempts').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('questions').optional().isArray(),
  body('questions.*.question_text').isString().isLength({ min: 3 }),
  body('questions.*.question_type').isIn(['single', 'multiple']),
  body('questions.*.points').optional().isInt({ min: 1, max: 10 }).toInt(),
  body('questions.*.options').isArray({ min: 2 }),
  body('questions.*.options.*.option_text').isString().isLength({ min: 1 }),
  body('questions.*.options.*.is_correct').isBoolean(),
];