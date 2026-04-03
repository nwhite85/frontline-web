/**
 * Send transactional emails via Resend (primary) or Zoho SMTP fallback.
 * Resend is used when RESEND_API_KEY is set; falls back to nodemailer/SMTP otherwise.
 * Never blocks the main flow — failures are logged and swallowed.
 */

import { logger } from '@/utils/logger';
import { EMAIL_BRAND } from '@/utils/emailTemplates';

export interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendTransactionalEmail(opts: TransactionalEmailOptions): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? `${EMAIL_BRAND.fromName} <${EMAIL_BRAND.fromEmail}>`;

  // ── Resend (primary) ──────────────────────────────────────────────────────
  if (resendKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        replyTo: opts.replyTo || undefined,
      });
      if (error) {
        logger.error('[Email] Resend error:', error);
        return false;
      }
      logger.log(`[Email] Sent via Resend: "${opts.subject}" to ${opts.to}`);
      return true;
    } catch (err) {
      logger.error('[Email] Resend exception:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  // ── Zoho SMTP fallback ────────────────────────────────────────────────────
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  if (!smtpUser || !smtpPass) {
    logger.warn('[Email] No email provider configured (set RESEND_API_KEY or SMTP_USER/SMTP_PASS) — skipping');
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtppro.zoho.eu',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `${EMAIL_BRAND.fromName} <${EMAIL_BRAND.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || EMAIL_BRAND.fromEmail,
    });

    logger.log(`[Email] Sent via SMTP: "${opts.subject}" to ${opts.to}`);
    return true;
  } catch (err) {
    logger.error('[Email] SMTP failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}
