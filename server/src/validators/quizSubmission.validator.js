import { body, param } from 'express-validator';

export const sessionIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
];

export const sessionIdQuizParamValidator = [
  param('sessionId').isInt({ min: 1 }).toInt(),
];

export const quizIdParamValidator = [
  param('quizId').isInt({ min: 1 }).toInt(),
];

export const submitQuizValidator = [
  param('quizId').isInt({ min: 1 }).toInt(),
  body('answers').isArray({ min: 1 }).withMessage('Au moins une réponse requise'),
  body('answers.*.question_id').isInt({ min: 1 }).toInt(),
  body('answers.*.selected_option_ids').isArray(),
  body('answers.*.selected_option_ids.*').isInt({ min: 1 }).toInt(),
];