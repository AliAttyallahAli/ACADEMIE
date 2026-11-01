import { validationResult } from 'express-validator';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  return res.status(422).json({
    error: 'Validation échouée',
    details: errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
      value: e.value,
    })),
    received: req.body,
  });
}