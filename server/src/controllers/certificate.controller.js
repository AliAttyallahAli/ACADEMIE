import { certificateService } from '../services/certificate.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const certificateController = {
  /**
   * GET /api/certificates
   * Liste les certificats de l'apprenante connectée.
   */
  list: asyncHandler(async (req, res) => {
    const items = await certificateService.listForLearner(req.user.id);
    res.json({
      items: items.map((c) => ({
        certificate_uuid: c.certificate_uuid,
        issued_at: c.issued_at,
        download_url: `/api/certificates/${c.certificate_uuid}/download`,
      })),
    });
  }),

  /**
   * GET /api/certificates/:uuid
   * Détails d'un certificat de l'apprenante.
   */
  getOne: asyncHandler(async (req, res) => {
    const cert = await certificateService.getByUuid(req.params.uuid);
    if (cert.learner_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    res.json({
      certificate_uuid: cert.certificate_uuid,
      issued_at: cert.issued_at,
      modules_snapshot: JSON.parse(cert.modules_snapshot),
      download_url: `/api/certificates/${cert.certificate_uuid}/download`,
    });
  }),

  /**
   * GET /api/certificates/:uuid/download
   * Télécharge le PDF.
   */
  download: asyncHandler(async (req, res) => {
    const { pdf_path } = await certificateService.getLearnerPdf(
      req.user.id,
      req.params.uuid
    );
    res.download(pdf_path, `ALKHER-Certificat-${req.params.uuid}.pdf`);
  }),
};