import { body, param, query } from 'express-validator';
import { RESPONSIBLE_ROLES } from '../config/constants.js';

export const createResponsibleValidator = [
  body('full_name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(RESPONSIBLE_ROLES).withMessage('Rôle invalide'),
  body('permissions_json').optional().isObject(),
  body('send_password_by_email').optional().isBoolean(),
];

export const updateResponsibleValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('role').optional().isIn(RESPONSIBLE_ROLES),
  body('permissions_json').optional().isObject(),
];

export const responsibleIdValidator = [
  param('id').isInt({ min: 1 }).toInt(),
];

export const listResponsiblesValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('role').optional().isIn(RESPONSIBLE_ROLES),
  query('is_active').optional().isIn(['true', 'false']),
];