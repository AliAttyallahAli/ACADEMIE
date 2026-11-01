import { body, param } from 'express-validator';

export const createForumPostValidator = [
  body('module_id').isInt({ min: 1 }).toInt(),
  body('parent_id').optional().isInt({ min: 1 }).toInt(),
  body('content').trim().isLength({ min: 5, max: 2000 })
    .withMessage('Message entre 5 et 2000 caractères'),
];

export const forumIdValidator = [param('id').isInt({ min: 1 }).toInt()];
export const moduleIdValidator = [param('moduleId').isInt({ min: 1 }).toInt()];

export const createSupportTicketValidator = [
  body('subject').trim().isLength({ min: 3, max: 200 }),
  body('message').trim().isLength({ min: 10, max: 2000 }),
];

export const replyTicketValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('reply').trim().isLength({ min: 3, max: 2000 }),
];