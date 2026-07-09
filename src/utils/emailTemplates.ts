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
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">FRONTLINE FITNESS</h1>
    </div>
    ${content}
    <div class="footer">
      <p><a href="https://frontlinefitness.co.uk" style="color:${BRAND.textMuted};text-decoration:none;font-weight:600">Frontline Fitness</a><br>
      Questions? Reply to this email or contact your trainer directly.</p>
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
  passwordSetupUrl?: string;
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
        ${data.passwordSetupUrl ? `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">1.</strong> <strong>Set your password</strong><br>
            <span style="color:${BRAND.textMuted}">Click the button below to create your password and activate your account. This link expires in 24 hours.</span>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">${data.passwordSetupUrl ? '2' : '1'}.</strong> <strong>Book your first session</strong><br>
            <span style="color:${BRAND.textMuted}">Check the schedule and reserve your spot in a class or 1-to-1 session.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">${data.passwordSetupUrl ? '3' : '2'}.</strong> <strong>Download the app</strong><br>
            <span style="color:${BRAND.textMuted}">Track workouts, nutrition, and progress all in one place.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
            <strong style="color:${BRAND.primary}">${data.passwordSetupUrl ? '4' : '3'}.</strong> <strong>Join the WhatsApp community</strong><br>
            <span style="color:${BRAND.textMuted}">Stay in the loop with sessions, updates, and the Frontline community.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0">
            <strong style="color:${BRAND.primary}">${data.passwordSetupUrl ? '5' : '4'}.</strong> <strong>Show up and crush it</strong><br>
            <span style="color:${BRAND.textMuted}">${data.trainerName ? `${data.trainerName} is` : 'Your trainer is'} ready to help you smash your goals.</span>
          </td>
        </tr>
      </table>
      <div style="background:${BRAND.bgLight};border-radius:8px;padding:16px 20px;margin:24px 0 8px;border-left:4px solid ${BRAND.primary}">
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px">Where to find us</p>
        <p style="margin:0 0 4px;font-weight:500;color:${BRAND.textDark}">Lydiard Park, Swindon, SN5 3PA</p>
        <a href="https://maps.app.goo.gl/NGKG5PJqeb2HNFFR9" style="color:${BRAND.primary};font-size:13px;text-decoration:none;font-weight:600">Get directions →</a>
      </div>
      ${data.passwordSetupUrl ? `
      <div style="text-align:center;margin:28px 0 8px">
        <a href="${data.passwordSetupUrl}" class="btn" style="color:#ffffff">Set Your Password</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.textMuted}">This link expires in 24 hours</p>
      <div style="text-align:center;margin:20px 0 4px">
        <a href="https://apps.apple.com/gb/app/frontline-fitness-members/id6758299642" style="color:${BRAND.primary};font-size:14px;font-weight:600;text-decoration:none">Download the App (iOS)</a>
      </div>
      <div style="text-align:center;margin:8px 0 8px">
        <a href="https://play.google.com/store/apps/details?id=com.frontline.client" style="color:${BRAND.primary};font-size:14px;font-weight:600;text-decoration:none">Download the App (Android)</a>
      </div>` : `
      <div style="text-align:center;margin:28px 0 4px">
        <a href="https://apps.apple.com/gb/app/frontline-fitness-members/id6758299642" class="btn" style="color:#ffffff">Download on iOS</a>
      </div>
      <div style="text-align:center;margin:8px 0 8px">
        <a href="https://play.google.com/store/apps/details?id=com.frontline.client" style="color:${BRAND.primary};font-size:14px;font-weight:600;text-decoration:none">Get it on Android</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.textMuted}">Available on iOS and Android</p>`}
      <div style="text-align:center;margin:20px 0 8px">
        <a href="https://chat.whatsapp.com/BEE0lVrHMx5IFSkG14sotN" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">Join the WhatsApp Group</a>
      </div>
    </div>
  `, subject);

  const steps = data.passwordSetupUrl
    ? `1. Set your password: ${data.passwordSetupUrl}\n2. Book your first session\n3. Download the app — iOS: https://apps.apple.com/gb/app/frontline-fitness-members/id6758299642 | Android: https://play.google.com/store/apps/details?id=com.frontline.client\n4. Join the WhatsApp group: https://chat.whatsapp.com/BEE0lVrHMx5IFSkG14sotN\n5. Show up and crush it!`
    : `1. Book your first session\n2. Download the app — iOS: https://apps.apple.com/gb/app/frontline-fitness-members/id6758299642 | Android: https://play.google.com/store/apps/details?id=com.frontline.client\n3. Join the WhatsApp group: https://chat.whatsapp.com/BEE0lVrHMx5IFSkG14sotN\n4. Show up and crush it!`
  const text = `${subject}\n\nHi ${data.clientName},\n\nWelcome to Frontline Fitness! We're thrilled to have you.\n\nWhat's next:\n${steps}\n\n${data.trainerName ? `${data.trainerName} is` : 'Your trainer is'} ready to help you smash your goals.\n\n— Frontline Fitness`;

  return { subject, html, text };
}

// ─── WhatsApp Nudge Email (sent 7 days after signup) ─────────────────────────

export function whatsappNudgeEmail(data: { clientName: string }): { subject: string; html: string; text: string } {
  const subject = 'Have you joined the Frontline community yet?';
  const WA_URL = 'https://chat.whatsapp.com/BEE0lVrHMx5IFSkG14sotN';

  const html = baseLayout(`
    <div class="body" style="text-align:center">
      <h2>Hi ${data.clientName} 👋</h2>
      <p>You've been with us for a week now — great to have you on board.</p>
    </div>
    <div class="body" style="padding-top:0">
      <p style="font-size:15px;line-height:1.6">One thing that makes a big difference: our members' WhatsApp group. It's where we share session reminders, updates, and general Frontline chat. Most of our members are already in there.</p>
      <p style="font-size:15px;line-height:1.6">If you haven't joined yet, tap the button below — takes two seconds.</p>
      <div style="text-align:center;margin:28px 0 16px">
        <a href="${WA_URL}" style="display:inline-block;background:#25D366;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px">Join the WhatsApp Group</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.textMuted}">See you at the park,<br><strong>Nick &amp; the Frontline team</strong></p>
    </div>
  `, subject);

  const text = `${subject}\n\nHi ${data.clientName},\n\nYou've been with us for a week now — great to have you on board.\n\nOne thing that makes a big difference: our members' WhatsApp group. It's where we share session reminders, updates, and general Frontline chat.\n\nJoin here: ${WA_URL}\n\nSee you at the park,\nNick & the Frontline team`;

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
      <div style="background:${BRAND.bgLight};border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid ${BRAND.primary}">
        <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px">Where to find us</p>
        <p style="margin:0 0 4px;font-weight:500;color:${BRAND.textDark}">Lydiard Park, Swindon, SN5 3PA</p>
        <a href="https://maps.app.goo.gl/NGKG5PJqeb2HNFFR9" style="color:${BRAND.primary};font-size:13px;text-decoration:none;font-weight:600">Get directions →</a>
      </div>
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

// ─── Trainer: New Signup Notification ───────────────────────────────────────

export interface TrainerNewSignupData {
  name: string
  email: string
  phone?: string
  planName?: string
}

export function trainerNewSignupEmail(data: TrainerNewSignupData): { subject: string; html: string; text: string } {
  const subject = `New signup: ${data.name}`

  const html = baseLayout(`
    <div class="body">
      <h2>New Member Signup</h2>
      <p>Someone just signed up from the website. They haven't paid yet — account is pending activation.</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:100px">Name</td><td style="padding:6px 0;font-weight:500">${data.name}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${data.email}" style="color:${BRAND.primary}">${data.email}</a></td></tr>
          ${data.phone ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Phone</td><td style="padding:6px 0;font-weight:500">${data.phone}</td></tr>` : ''}
          ${data.planName ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Plan</td><td style="padding:6px 0;font-weight:500">${data.planName}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `, subject)

  const text = `New signup: ${data.name}\n\nEmail: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ''}${data.planName ? `\nPlan: ${data.planName}` : ''}\n\nAccount is pending payment.`

  return { subject, html, text }
}

// ─── Trainer: New Payment Notification ──────────────────────────────────────

export interface TrainerNewPaymentData {
  clientName: string
  clientEmail?: string
  planName: string
  amount: string // e.g. "£55.00"
  planType?: string // "credit_package" | "recurring"
}

export function trainerNewPaymentEmail(data: TrainerNewPaymentData): { subject: string; html: string; text: string } {
  const subject = `Payment received: ${data.clientName} — ${data.planName}`
  const isPack = data.planType === 'credit_package'

  const html = baseLayout(`
    <div class="body">
      <h2>Payment Received</h2>
      <p>A new ${isPack ? 'credit pack purchase' : 'membership payment'} has been confirmed via Stripe.</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:100px">Name</td><td style="padding:6px 0;font-weight:500">${data.clientName}</td></tr>
          ${data.clientEmail ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${data.clientEmail}" style="color:${BRAND.primary}">${data.clientEmail}</a></td></tr>` : ''}
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Plan</td><td style="padding:6px 0;font-weight:500">${data.planName}</td></tr>
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Amount</td><td style="padding:6px 0;font-weight:600;color:${BRAND.primary}">${data.amount}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:${BRAND.textMuted}">Payment processed via Stripe. Account ${isPack ? 'credits have been' : 'membership has been'} activated.</p>
    </div>
  `, subject)

  const text = `Payment received: ${data.clientName}\n\nPlan: ${data.planName}\nAmount: ${data.amount}${data.clientEmail ? `\nEmail: ${data.clientEmail}` : ''}`

  return { subject, html, text }
}

// ─── Trainer: Shop Order Notification ───────────────────────────────────────

export interface TrainerShopOrderData {
  customerName: string
  customerEmail?: string
  items: Array<{ name: string; color?: string | null; size?: string | null; qty: number; price: number }>
  total: number
}

export function shopOrderCustomerEmail(data: { customerName: string; items: TrainerShopOrderData['items']; total: number }): { subject: string; html: string } {
  const subject = 'Your Frontline Fitness order — payment confirmed'

  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:500">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.textMuted}">${[i.color, i.size].filter(Boolean).join(' / ') || '—'}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:center">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600">£${(i.price * i.qty).toFixed(2)}</td>
    </tr>`).join('')

  const html = baseLayout(`
    <div class="body">
      <h2>Order Confirmed!</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your order is confirmed and payment received. Nick will be in touch to arrange collection at the park.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">
        <thead>
          <tr style="color:${BRAND.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px">
            <th style="text-align:left;padding-bottom:8px;font-weight:600">Item</th>
            <th style="text-align:left;padding-bottom:8px;font-weight:600">Options</th>
            <th style="text-align:center;padding-bottom:8px;font-weight:600">Qty</th>
            <th style="text-align:right;padding-bottom:8px;font-weight:600">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="text-align:right;font-weight:700;font-size:16px;color:${BRAND.primary}">Total: £${data.total.toFixed(2)}</p>
    </div>
  `, subject)

  return { subject, html }
}

export function trainerShopOrderEmail(data: TrainerShopOrderData): { subject: string; html: string } {
  const subject = `New shop order from ${data.customerName} — £${data.total.toFixed(2)}`

  const itemRows = data.items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};font-weight:500">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.textMuted}">${[i.color, i.size].filter(Boolean).join(' / ') || '—'}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:center">${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};text-align:right;font-weight:600">£${(i.price * i.qty).toFixed(2)}</td>
    </tr>`).join('')

  const html = baseLayout(`
    <div class="body">
      <h2>New Shop Order</h2>
      <p>A new order has been placed and payment confirmed.</p>
      <div class="detail-card">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600;width:100px">Customer</td><td style="padding:6px 0;font-weight:500">${data.customerName}</td></tr>
          ${data.customerEmail ? `<tr><td style="padding:6px 0;color:${BRAND.textMuted};font-weight:600">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${data.customerEmail}" style="color:${BRAND.primary}">${data.customerEmail}</a></td></tr>` : ''}
        </table>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">
        <thead>
          <tr style="color:${BRAND.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px">
            <th style="text-align:left;padding-bottom:8px;font-weight:600">Item</th>
            <th style="text-align:left;padding-bottom:8px;font-weight:600">Options</th>
            <th style="text-align:center;padding-bottom:8px;font-weight:600">Qty</th>
            <th style="text-align:right;padding-bottom:8px;font-weight:600">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="text-align:right;font-weight:700;font-size:16px;margin:8px 0 0;color:${BRAND.primary}">Total: £${data.total.toFixed(2)}</p>
      <p style="font-size:13px;color:${BRAND.textMuted};margin-top:16px">Arrange collection at the park when you see the customer next.</p>
    </div>
  `, subject)

  return { subject, html }
}

// ─── Email sending helper ────────────────────────────────────────────────────

// ─── Password Reset ─────────────────────────────────────────────────────────

export function passwordResetEmail(data: { clientName?: string; resetUrl: string }): { subject: string; html: string; text: string } {
  const name = data.clientName || 'there'
  const subject = 'Set your Frontline Fitness password'

  const html = baseLayout(`
    <div class="body">
      <h2>Set your password</h2>
      <p>Hi ${name},</p>
      <p>Click the button below to set your Frontline Fitness account password. This link is valid for 24 hours.</p>
      <div style="text-align:center;margin:28px 0 8px">
        <a href="${data.resetUrl}" class="btn" style="color:#ffffff">Set Password</a>
      </div>
      <p style="text-align:center;font-size:13px;color:${BRAND.textMuted}">This link expires in 24 hours</p>
      <p style="font-size:13px;color:${BRAND.textMuted};margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `, subject)

  const text = `${subject}\n\nHi ${name},\n\nClick the link below to set your Frontline Fitness password:\n${data.resetUrl}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.\n\n— Frontline Fitness`

  return { subject, html, text }
}

export function tierPromotionEmail({ clientName, currentTier, nextTier }: {
  clientName: string;
  currentTier: string;
  nextTier: string;
}): { html: string; text: string } {
  const currentLabel = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
  const nextLabel = nextTier.charAt(0).toUpperCase() + nextTier.slice(1);

  const html = baseLayout(`
    <div class="body">
      <h2>Level Up Required ⬆️</h2>
      <p><strong>${clientName}</strong> has met the checkpoint requirements to move up from <strong>${currentLabel}</strong> to <strong>${nextLabel}</strong>.</p>
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">Client</span>
          <span class="detail-value">${clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Level</span>
          <span class="detail-value">${currentLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Ready For</span>
          <span class="detail-value">${nextLabel}</span>
        </div>
      </div>
      <p>Log in to the dashboard to update their ability level when ready.</p>
      <p style="margin-top:24px;text-align:center">
        <a href="https://frontlinefitness.co.uk/dashboard/clients" class="btn">View Clients</a>
      </p>
    </div>
  `, `${clientName} is ready to move up to ${nextLabel}`);

  const text = `Level Up Required\n\n${clientName} has met the checkpoint requirements to move up from ${currentLabel} to ${nextLabel}.\n\nLog in to update their ability level: https://frontlinefitness.co.uk/dashboard/clients`;

  return { html, text };
}

export { BRAND as EMAIL_BRAND };
