export function requirePermission(resource, action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    // Super-admin : tout permis
    if (req.user.type === 'admin') return next();

    // Responsable : vérifier permissions_json
    if (req.user.type === 'responsible') {
      try {
        const perms = JSON.parse(req.user.permissions_json || '{}');
        if (perms[resource]?.includes(action)) return next();
      } catch {}
      return res.status(403).json({
        error: `Permission insuffisante : ${resource}:${action}`,
      });
    }

    return res.status(403).json({ error: 'Accès refusé' });
  };
}