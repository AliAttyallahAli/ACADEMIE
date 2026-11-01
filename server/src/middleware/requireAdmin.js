export function requireAdmin(req, res, next) {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé au super-admin' });
  }
  next();
}