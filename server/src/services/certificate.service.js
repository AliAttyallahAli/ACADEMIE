import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';
import { certificateRepo } from '../repositories/certificate.repo.js';
import { dbAsync } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CERT_DIR = path.resolve(env.uploadDir, 'certificates');

/**
 * Signature HMAC-SHA256 du couple (uuid + learner_id + issued_at).
 */
function signCertificate(certificate_uuid, learner_id, issued_at) {
  const data = `${certificate_uuid}|${learner_id}|${issued_at}`;
  return crypto
    .createHmac('sha256', env.certSecret)
    .update(data)
    .digest('hex');
}

/**
 * Vérifie la signature HMAC d'un certificat existant.
 */
function verifySignature(certificate) {
  const expected = signCertificate(
    certificate.certificate_uuid,
    certificate.learner_id,
    certificate.issued_at
  );
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(certificate.verify_signature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Construit l'URL publique de vérification avec signature.
 */
function buildVerifyUrl(certificate_uuid, verify_signature) {
  return `${env.baseUrl}/verify/${certificate_uuid}?sig=${verify_signature}`;
}

/**
 * Récupère les données nécessaires pour le certificat :
 * apprenante + modules terminés avec dates.
 */
async function buildCertificateData(learner_id) {
  const learner = await dbAsync.get(
    `SELECT id, full_name, birth_date, email FROM learners WHERE id = ?`,
    [learner_id]
  );
  if (!learner) {
    const err = new Error('Apprenante introuvable');
    err.status = 404;
    throw err;
  }

  const modules = await dbAsync.all(
    `SELECT e.id AS enrollment_id, m.id AS module_id, m.title,
            e.start_date, e.completed_at
     FROM enrollments e
     JOIN modules m ON m.id = e.module_id
     WHERE e.learner_id = ? AND e.status = 'completed' AND e.payment_status = 'paid'
     ORDER BY e.completed_at ASC`,
    [learner_id]
  );

  if (!modules.length) {
    const err = new Error('Aucun module terminé : impossible de générer un certificat');
    err.status = 400;
    throw err;
  }

  return { learner, modules };
}

export const certificateService = {
  /**
   * Génère (ou retourne si existant) le certificat d'une apprenante.
   * Retourne l'objet certificat + le chemin du PDF.
   */
  async generateForLearner(learner_id) {
    // 1. Vérifier si un certificat existe déjà
    const existing = await certificateRepo.findLatestByLearner(learner_id);
    if (existing) {
      const pdfPath = await this.getPdfPath(existing.certificate_uuid);
      return { ...existing, pdf_path: pdfPath };
    }

    // 2. Récupérer données
    const { learner, modules } = await buildCertificateData(learner_id);

    // 3. Générer UUID + signature HMAC
    const certificate_uuid = crypto.randomUUID();
    const issued_at = new Date().toISOString();

    const snapshot = {
      learner: {
        full_name: learner.full_name,
        birth_date: learner.birth_date,
      },
      modules: modules.map((m) => ({
        title: m.title,
        start_date: m.start_date,
        completed_at: m.completed_at,
      })),
      issued_at,
    };

    const verify_signature = signCertificate(certificate_uuid, learner_id, issued_at);

    // 4. Persister en base
    const id = await certificateRepo.create({
      certificate_uuid,
      learner_id,
      modules_snapshot: JSON.stringify(snapshot),
      verify_signature,
    });

    // 5. Générer le PDF
    const pdfPath = await this.generatePdf({
      certificate_uuid,
      verify_signature,
      issued_at,
      learner,
      modules,
    });

    logger.success(`Certificat généré pour learner ${learner_id} (${certificate_uuid})`);

    return {
      id,
      certificate_uuid,
      learner_id,
      issued_at,
      verify_signature,
      modules_snapshot: JSON.stringify(snapshot),
      pdf_path: pdfPath,
    };
  },

  /**
   * Génère le PDF du certificat.
   */
  async generatePdf({ certificate_uuid, verify_signature, issued_at, learner, modules }) {
    await fs.mkdir(CERT_DIR, { recursive: true });

    const filename = `certificate-${certificate_uuid}.pdf`;
    const filepath = path.join(CERT_DIR, filename);

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: 'Attestation ALKHER ACADEMY',
        Author: 'ALKHER ACADEMY',
        Subject: `Certificat ${certificate_uuid}`,
      },
    });

    const stream = (await import('node:fs')).createWriteStream(filepath);
    doc.pipe(stream);

    const { width, height } = doc.page;

    // ─── Fond dégradé / bandeau décoratif ───
    doc.rect(0, 0, width, 20).fill('#1e3a8a');
    doc.rect(0, height - 20, width, 20).fill('#1e3a8a');

    // ─── Bordure ───
    doc
      .rect(30, 30, width - 60, height - 60)
      .lineWidth(2)
      .stroke('#1e3a8a');

    // ─── En-tête ───
    doc
      .fillColor('#1e3a8a')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('ALKHER ACADEMY', 0, 60, { align: 'center' });

    doc
      .fillColor('#333')
      .fontSize(12)
      .font('Helvetica')
      .text('Plateforme de formation en ligne', 0, 95, { align: 'center' });

    doc
      .moveDown(1.5)
      .fillColor('#1e3a8a')
      .fontSize(34)
      .font('Helvetica-Bold')
      .text('ATTESTATION DE FIN DE FORMATION', 0, 140, { align: 'center' });

    doc.moveDown(1);

    // ─── Texte principal ───
    doc
      .fillColor('#333')
      .fontSize(14)
      .font('Helvetica')
      .text('Le présent document atteste que', 0, 210, { align: 'center' });

    doc
      .moveDown(0.5)
      .fillColor('#0f172a')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(learner.full_name, { align: 'center' });

    doc
      .moveDown(0.3)
      .fillColor('#555')
      .fontSize(12)
      .font('Helvetica')
      .text(`Née le ${formatDate(learner.birth_date)}`, { align: 'center' });

    doc
      .moveDown(1)
      .fillColor('#333')
      .fontSize(13)
      .text('a suivi avec succès les modules suivants :', { align: 'center' });

    doc.moveDown(0.8);

    // ─── Liste des modules ───
    modules.forEach((m) => {
      const line = `•  ${m.title} — du ${formatDate(m.start_date)} au ${formatDate(m.completed_at)}`;
      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica')
        .text(line, { align: 'center' });
    });

    doc
      .moveDown(1.2)
      .fillColor('#333')
      .fontSize(11)
      .text(
        `Délivré le ${formatDate(issued_at)}`,
        { align: 'center' }
      );

    // ─── QR code + N° certificat (bas gauche) ───
    const verifyUrl = buildVerifyUrl(certificate_uuid, verify_signature);
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1e3a8a', light: '#ffffff' },
    });

    const qrSize = 110;
    const qrX = 60;
    const qrY = height - qrSize - 60;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    doc
      .fillColor('#555')
      .fontSize(8)
      .font('Helvetica')
      .text('Scannez pour vérifier', qrX, qrY + qrSize + 5, {
        width: qrSize,
        align: 'center',
      });

    // ─── N° certificat + signature (bas droite) ───
    const infoX = width - 340;
    const infoY = height - 130;

    doc
      .fillColor('#555')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('N° de certificat', infoX, infoY);

    doc
      .fillColor('#0f172a')
      .fontSize(9)
      .font('Courier')
      .text(certificate_uuid, infoX, infoY + 14, { width: 320 });

    doc
      .fillColor('#555')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Signature de vérification (HMAC)', infoX, infoY + 40);

    doc
      .fillColor('#0f172a')
      .fontSize(7)
      .font('Courier')
      .text(verify_signature, infoX, infoY + 54, { width: 320 });

    doc
      .fillColor('#888')
      .fontSize(7)
      .font('Helvetica')
      .text(
        `Vérifiable en ligne sur ${env.baseUrl}/verify/${certificate_uuid}`,
        infoX,
        infoY + 80,
        { width: 320 }
      );

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return filepath;
  },

  /**
   * Chemin du PDF existant.
   */
  async getPdfPath(certificate_uuid) {
    const filepath = path.join(CERT_DIR, `certificate-${certificate_uuid}.pdf`);
    try {
      await fs.access(filepath);
      return filepath;
    } catch {
      return null;
    }
  },

  /**
   * Récupère un certificat par UUID.
   */
  async getByUuid(uuid) {
    const cert = await certificateRepo.findByUuid(uuid);
    if (!cert) {
      const err = new Error('Certificat introuvable');
      err.status = 404;
      throw err;
    }
    return cert;
  },

  /**
   * Vérifie la validité d'un certificat via son UUID.
   * Retourne : { valid, learner, modules, issued_at, error? }
   */
  async verifyByUuid(uuid) {
    const cert = await certificateRepo.findByUuid(uuid);
    if (!cert) {
      return { valid: false, error: 'Certificat introuvable' };
    }

    const isValid = verifySignature(cert);

    // Infos complémentaires pour affichage public
    const learner = await dbAsync.get(
      `SELECT full_name, birth_date FROM learners WHERE id = ?`,
      [cert.learner_id]
    );

    const snapshot = JSON.parse(cert.modules_snapshot);

    return {
      valid: isValid,
      certificate_uuid: cert.certificate_uuid,
      issued_at: cert.issued_at,
      learner: learner
        ? { full_name: learner.full_name, birth_date: learner.birth_date }
        : null,
      modules: snapshot.modules || [],
      error: isValid ? null : 'Signature invalide : certificat falsifié ou altéré',
    };
  },

  /**
   * Récupère tous les certificats d'une apprenante.
   */
  async listForLearner(learner_id) {
    return certificateRepo.findByLearner(learner_id);
  },

  /**
   * Retourne le PDF d'un certificat appartenant à une apprenante.
   */
  async getLearnerPdf(learner_id, uuid) {
    const cert = await certificateRepo.findByUuid(uuid);
    if (!cert || cert.learner_id !== learner_id) {
      const err = new Error('Certificat introuvable ou non autorisé');
      err.status = 404;
      throw err;
    }
    const pdfPath = await this.getPdfPath(uuid);
    if (!pdfPath) {
      // Régénérer si le fichier a été supprimé manuellement
      return this.generateForLearner(learner_id).then(() => {
        const newPath = path.join(CERT_DIR, `certificate-${uuid}.pdf`);
        return { certificate: cert, pdf_path: newPath };
      });
    }
    return { certificate: cert, pdf_path: pdfPath };
  },
};

// ─── Helper : format date FR ───
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}