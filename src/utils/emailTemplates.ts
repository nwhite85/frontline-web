/**
 * Email templates for Frontline Fitness
 * Branded HTML email templates for bookings, payments, and welcome emails.
 * These can be used directly or inserted into the email_templates Supabase table.
 */

const BRAND = {
  primary: '#4982e8',
  primaryDark: '#3a6bc5',
  textDark: '#1a1a2e',
  textMuted: '#6b7280',
  bgLight: '#f8f9fc',
  white: '#ffffff',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  fromEmail: process.env.SMTP_USER || 'noreply@frontlinefitness.co.uk',
  fromName: 'Frontline Fitness',
};

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Frontline Fitness</title>
${preheader ? `<span style="display:none;font-size:1px;color:#f8f9fc;max-height:0;overflow:hidden">${preheader}</span>` : ''}
<style>
  body { margin:0; padding:0; background:${BRAND.bgLight}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .wrapper { width:100%; background:${BRAND.bgLight}; padding:32px 0; }
  .container { max-width:600px; margin:0 auto; background:${BRAND.white}; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .header { background:${BRAND.primary}; padding:28px 32px; text-align:center; }
  .header h1 { color:${BRAND.white}; margin:0; font-size:24px; font-weight:700; letter-spacing:-0.5px; }
  .body { padding:32px; color:${BRAND.textDark}; line-height:1.6; font-size:15px; }
  .body h2 { margin:0 0 16px; font-size:20px; color:${BRAND.textDark}; }
  .body p { margin:0 0 14px; }
  .detail-card { background:${BRAND.bgLight}; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid ${BRAND.primary}; }
  .detail-row { display:flex; padding:6px 0; }
  .detail-label { font-weight:600; color:${BRAND.textMuted}; min-width:120px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; }
  .detail-value { color:${BRAND.textDark}; font-weight:500; }
  .btn { display:inline-block; background:${BRAND.primary}; color:${BRAND.white}!important; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px; }
  .btn:hover { background:${BRAND.primaryDark}; }
  .footer { padding:24px 32px; text-align:center; border-top:1px solid ${BRAND.border}; }
  .footer p { margin:0; font-size:12px; color:${BRAND.textMuted}; line-height:1.5; }
  .amount { font-size:28px; font-weight:700; color:${BRAND.primary}; }
  @media only screen and (max-width:640px) {
    .container { margin:0 12px; }
    .body, .header, .footer { padding:20px!important; }
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <img src="https://frontlinefitness.co.uk/logos/frontline-logo-fitness-white.svg" alt="Frontline Fitness" width="240" height="30" style="display:block;margin:0 auto;max-width:240px;height:auto;" />
    </div>
    ${content}
    <div class="footer">
      <p>Frontline Fitness<br>
      Questions? Reply to this email or contact your trainer directly.<br><br>
      &copy; ${new Date().getFullYear()} Frontline Fitness. All rights reserved.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Booking Confirmation ────────────────────────────────────────────────────

export interface BookingConfirmationData {
  clientName: string;
  bookingType: 'class' | 'event';
  itemName: string;
  date: string;
  time: string;
  location?: string;
  trainerName?: string;
  status?: 'confirmed' | 'waitlist';
}

export function bookingConfirmationEmail(data: BookingConfirmationData): { subject: string; html: string; text: string } {
  const isWaitlist = data.status === 'waitlist';
  const subject = isWaitlist
    ? `Waitlisted: ${data.itemName}`
    : `Booking Confirmed: ${data.itemName}`;

  const statusBadge = isWaitlist
    ? `<span style="background:${BRAND.warning};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">WAITLISTED</span>`
    : `<span style="background:${BRAND.success};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">CONFIRMED</span>`;

  const html = baseLayout(`
    <div class="body">
      <h2>${isWaitlist ? 'You\'re on the Waitlist' : 'Booking Confirmed!'} ${statusBadge}</h2>
      <p>Hi ${data.clientName},</p>
      <p>${isWaitlist
        ? `You've been added to the waitlist for <strong>${data.itemName}</strong>. We'll notify you if a spot opens up.`
        : `Your ${data.bookingType} has been successfully booked. Here are the details:`
      }</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:120px">What</td><td style="padding:6px 0;font-weight:500">${data.itemName}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Date</td><td style="padding:6px 0;font-weight:500">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Time</td><td style="padding:6px 0;font-weight:500">${data.time}</td></tr>
          ${data.location ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Location</td><td style="padding:6px 0;font-weight:500">${data.location}</td></tr>` : ''}
          ${data.trainerName ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Trainer</td><td style="padding:6px 0;font-weight:500">${data.trainerName}</td></tr>` : ''}
        </table>
      </div>
      ${!isWaitlist ? '<p>See you there! 💪</p>' : '<p>We\'ll keep you posted!</p>'}
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.clientName},\n\n${isWaitlist ? 'You\'ve been added to the waitlist' : 'Your booking is confirmed'}.\n\nWhat: ${data.itemName}\nDate: ${data.date}\nTime: ${data.time}${data.location ? `\nLocation: ${data.location}` : ''}${data.trainerName ? `\nTrainer: ${data.trainerName}` : ''}\n\n— Frontline Fitness`;

  return { subject, html, text };
}

// ─── Booking Cancellation ────────────────────────────────────────────────────

export interface BookingCancellationData {
  clientName: string;
  itemName: string;
  date: string;
  time: string;
  refundInfo?: string;
}

export function bookingCancellationEmail(data: BookingCancellationData): { subject: string; html: string; text: string } {
  const subject = `Booking Cancelled: ${data.itemName}`;

  const html = baseLayout(`
    <div class="body">
      <h2>Booking Cancelled</h2>
      <p>Hi ${data.clientName},</p>
      <p>Your booking for <strong>${data.itemName}</strong> has been cancelled.</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:120px">What</td><td style="padding:6px 0;font-weight:500">${data.itemName}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Date</td><td style="padding:6px 0;font-weight:500">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Time</td><td style="padding:6px 0;font-weight:500">${data.time}</td></tr>
        </table>
      </div>
      ${data.refundInfo ? `<p><strong>Refund:</strong> ${data.refundInfo}</p>` : ''}
      <p>If you'd like to rebook, check the schedule for available slots.</p>
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.clientName},\n\nYour booking for ${data.itemName} on ${data.date} at ${data.time} has been cancelled.${data.refundInfo ? `\n\nRefund: ${data.refundInfo}` : ''}\n\n— Frontline Fitness`;

  return { subject, html, text };
}

// ─── Payment Receipt ─────────────────────────────────────────────────────────

export interface PaymentReceiptData {
  clientName: string;
  amount: string; // formatted, e.g. "£29.99"
  description: string;
  date: string;
  paymentMethod?: string;
  referenceId?: string;
}

export function paymentReceiptEmail(data: PaymentReceiptData): { subject: string; html: string; text: string } {
  const subject = `Payment Receipt — ${data.amount}`;

  const html = baseLayout(`
    <div class="body" style="text-align:center">
      <h2>Payment Received</h2>
      <p>Hi ${data.clientName},</p>
      <p>Thank you for your payment.</p>
      <div class="amount">${data.amount}</div>
      <p style="color:${BRAND.textMuted};margin-top:4px">${data.description}</p>
    </div>
    <div class="body" style="padding-top:0">
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:120px">Date</td><td style="padding:6px 0;font-weight:500">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">For</td><td style="padding:6px 0;font-weight:500">${data.description}</td></tr>
          ${data.paymentMethod ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Paid via</td><td style="padding:6px 0;font-weight:500">${data.paymentMethod}</td></tr>` : ''}
          ${data.referenceId ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Reference</td><td style="padding:6px 0;font-weight:500;font-family:monospace;font-size:12px">${data.referenceId}</td></tr>` : ''}
        </table>
      </div>
      <p style="font-size:13px;color:${BRAND.textMuted}">Please keep this email as your receipt.</p>
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.clientName},\n\nPayment of ${data.amount} received.\n\nDate: ${data.date}\nFor: ${data.description}${data.paymentMethod ? `\nPaid via: ${data.paymentMethod}` : ''}${data.referenceId ? `\nReference: ${data.referenceId}` : ''}\n\n— Frontline Fitness`;

  return { subject, html, text };
}

// ─── Welcome Email ───────────────────────────────────────────────────────────

export interface WelcomeEmailData {
  clientName: string;
  trainerName?: string;
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const subject = 'Welcome to Frontline Fitness! 🎉';

  const html = baseLayout(`
    <div class="body" style="text-align:center">
      <h2>Welcome to the team, ${data.clientName}! 🎉</h2>
      <p>We're thrilled to have you on board. Your fitness journey starts now.</p>
    </div>
    <div class="body" style="padding-top:0">
      <h3 style="margin:0 0 12px;font-size:16px">What's next?</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">1.</strong> <strong>Complete your profile</strong><br>
            <span style="color:${BRAND.textMuted}">Add your goals, measurements, and preferences so your trainer can personalise your plan.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">2.</strong> <strong>Book your first session</strong><br>
            <span style="color:${BRAND.textMuted}">Check the schedule and reserve your spot in a class or 1-to-1 session.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">3.</strong> <strong>Download the app</strong><br>
            <span style="color:${BRAND.textMuted}">Track workouts, nutrition, and progress all in one place.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0">
            <strong style="color:${BRAND.primary}">4.</strong> <strong>Show up and crush it</strong><br>
            <span style="color:${BRAND.textMuted}">${data.trainerName ? `${data.trainerName} is` : 'Your trainer is'} ready to help you smash your goals.</span>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:28px 0 8px">
        <a href="https://apps.apple.com/app/frontline-fitness" class="btn" style="color:#ffffff">Download the App</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.textMuted}">Available on iOS and Android</p>
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.clientName},\n\nWelcome to Frontline Fitness! We're thrilled to have you.\n\nWhat's next:\n1. Complete your profile\n2. Book your first session\n3. Download the app\n4. Show up and crush it!\n\n${data.trainerName ? `${data.trainerName} is` : 'Your trainer is'} ready to help you smash your goals.\n\n— Frontline Fitness`;

  return { subject, html, text };
}

// ─── Trialist Booking Confirmation ───────────────────────────────────────────

export interface TrialistBookingData {
  firstName: string;
  lastName: string;
  date: string;
  time: string;
  location?: string;
  trainerName?: string;
}

export function trialistBookingEmail(data: TrialistBookingData): { subject: string; html: string; text: string } {
  const subject = `You're Booked! Free Trial Class Confirmed`;

  const html = baseLayout(`
    <div class="body">
      <h2>Your Free Trial is Confirmed 🎉</h2>
      <p>Hi ${data.firstName},</p>
      <p>We're looking forward to seeing you. Here are your class details:</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:120px">Date</td><td style="padding:6px 0;font-weight:500">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Time</td><td style="padding:6px 0;font-weight:500">${data.time}</td></tr>
          ${data.location ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Location</td><td style="padding:6px 0;font-weight:500">${data.location}</td></tr>` : ''}
        </table>
      </div>
      <p><strong>What to bring:</strong></p>
      <ul style="color:${BRAND.textDark};line-height:2">
        <li>Water bottle</li>
        <li>Trainers / comfortable workout clothes</li>
      </ul>
      <p>If you need to cancel or have any questions, just reply to this email.</p>
      <p>See you there!</p>
      ${data.trainerName ? `<p style="color:${BRAND.textMuted}">— ${data.trainerName}, Frontline Fitness</p>` : `<p style="color:${BRAND.textMuted}">— Frontline Fitness</p>`}
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.firstName},\n\nYour free trial class is confirmed!\n\nDate: ${data.date}\nTime: ${data.time}${data.location ? `\nLocation: ${data.location}` : ''}\n\nWhat to bring:\n- Water bottle\n- Trainers / comfortable workout clothes\n- A good attitude!\n\nIf you need to cancel or have questions, just reply to this email.\n\nSee you there!\n— Frontline Fitness`;

  return { subject, html, text };
}

export function trainerNewTrialistEmail(data: TrialistBookingData & { email: string }): { subject: string; html: string; text: string } {
  const subject = `New Trial Booking: ${data.firstName} ${data.lastName}`;

  const html = baseLayout(`
    <div class="body">
      <h2>New Trial Booking 🆕</h2>
      <p>Someone just booked a free trial class on your website.</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:120px">Name</td><td style="padding:6px 0;font-weight:500">${data.firstName} ${data.lastName}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${data.email}" style="color:${BRAND.primary}">${data.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Class Date</td><td style="padding:6px 0;font-weight:500">${data.date}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Time</td><td style="padding:6px 0;font-weight:500">${data.time}</td></tr>
        </table>
      </div>
    </div>
  `, subject);

  const text = `New Trial Booking\n\nName: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nClass Date: ${data.date}\nTime: ${data.time}`;

  return { subject, html, text };
}

// ─── Email sending helper ────────────────────────────────────────────────────

export { BRAND as EMAIL_BRAND };
