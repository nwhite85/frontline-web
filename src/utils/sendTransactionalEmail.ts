/**
 * Send transactional emails via Zoho SMTP (nodemailer).
 * Falls back silently on failure — transactional emails should never block the main flow.
 *
 * Required env vars:
 *   SMTP_HOST=smtppro.zoho.eu
 *   SMTP_PORT=465
 *   SMTP_USER=noreply@frontlinefitness.co.uk
 *   SMTP_PASS=<zoho app password>
 */

import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';
import { EMAIL_BRAND } from '@/utils/emailTemplates';

const smtpHost = process.env.SMTP_HOST || 'smtppro.zoho.eu';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transporter = smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

export interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendTransactionalEmail(opts: TransactionalEmailOptions): Promise<boolean> {
  if (!transporter) {
    logger.warn('[Email] SMTP not configured (missing SMTP_USER/SMTP_PASS) — skipping email');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `${EMAIL_BRAND.fromName} <${EMAIL_BRAND.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || EMAIL_BRAND.fromEmail,
    });

    logger.log(`[Email] Sent "${opts.subject}" to ${opts.to}`);
    return true;
  } catch (error) {
    logger.error('[Email] Failed to send email:', error instanceof Error ? error.message : error);
    throw error;
  }
}
