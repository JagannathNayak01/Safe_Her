const Incident = require('../models/Incident');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// ── Nodemailer transporter (Gmail) ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Escalation timeout store ────────────────────────────────────────────────
// Key: incident ID (string), Value: setTimeout reference
const escalationTimers = new Map();
const ESCALATION_DELAY_MS = 3 * 60 * 1000; // 3 minutes

// ── Build SOS email HTML ────────────────────────────────────────────────────
function buildSosEmailHtml(user, contact, lat, lng, isEscalation = false) {
  const relationship = contact.relationship ? contact.relationship.trim() : null;
  const greeting = relationship
    ? `Dear ${relationship} (${contact.name}),`
    : `Dear ${contact.name},`;
  const relationshipLine = relationship
    ? `As <strong>${user.name}</strong>'s <strong>${relationship}</strong>, your immediate help is needed.`
    : `Please help <strong>${user.name}</strong> immediately.`;
  const locationLink =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : null;

  const escalationBanner = isEscalation
    ? `<tr>
        <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:14px 28px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">
            ⚠️ ESCALATED ALERT — Primary contacts have not responded
          </p>
        </td>
      </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>SafeHer Emergency Alert</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Urgent banner -->
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:linear-gradient(135deg,#dc2626,#991b1b);">
    <tr>
      <td align="center" style="padding:16px 20px;">
        <p style="margin:0;color:#fff;font-size:20px;font-weight:900;
                  letter-spacing:.06em;text-transform:uppercase;">
          🚨 EMERGENCY SOS ALERT 🚨
        </p>
        <p style="margin:4px 0 0;color:#fca5a5;font-size:13px;font-weight:600;">
          IMMEDIATE ACTION REQUIRED — DO NOT IGNORE
        </p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:14px;overflow:hidden;
                      box-shadow:0 8px 32px rgba(0,0,0,0.12);max-width:600px;width:100%;">

          <!-- App header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a,#1e293b);
                        padding:22px 32px;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#06b6d4;">🛡️ SafeHer</span>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;
                        text-transform:uppercase;letter-spacing:.1em;">
                Personal Safety &amp; Emergency Alert System
              </p>
            </td>
          </tr>

          ${escalationBanner}

          <!-- Urgent notice -->
          <tr>
            <td style="background:#fef2f2;border-left:5px solid #dc2626;padding:16px 28px;">
              <p style="margin:0;font-size:14px;color:#991b1b;font-weight:700;">
                ⚠️  This is a REAL emergency — not a test. React immediately.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 32px;">
              <p style="margin:0 0 18px;font-size:16px;color:#0f172a;font-weight:700;">${greeting}</p>
              <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.75;">
                <span style="color:#dc2626;font-size:18px;font-weight:800;">${user.name}</span>
                has activated an <strong>Emergency SOS Alert</strong> on SafeHer.
                ${relationshipLine}
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.75;">
                Please <strong>call or reach them right now</strong>.
                If you cannot, contact emergency services and share the location below.
              </p>

              <!-- Action call buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;border-collapse:collapse;">
                <tr>
                  ${user.phone ? `
                  <td style="padding:4px;">
                    <a href="tel:${user.phone}"
                       style="display:block;background:linear-gradient(135deg,#dc2626,#b91c1c);
                              color:#fff;text-decoration:none;padding:13px 10px;
                              border-radius:10px;font-size:14px;font-weight:800;
                              text-align:center;box-shadow:0 4px 14px rgba(220,38,38,0.4);">
                      📞 Call ${user.name}
                    </a>
                  </td>` : ''}
                  <td style="padding:4px;">
                    <a href="tel:112"
                       style="display:block;background:linear-gradient(135deg,#7c3aed,#5b21b6);
                              color:#fff;text-decoration:none;padding:13px 10px;
                              border-radius:10px;font-size:14px;font-weight:800;
                              text-align:center;box-shadow:0 4px 14px rgba(124,58,237,0.4);">
                      🚨 Emergency 112
                    </a>
                  </td>
                  <td style="padding:4px;">
                    <a href="tel:100"
                       style="display:block;background:linear-gradient(135deg,#0369a1,#075985);
                              color:#fff;text-decoration:none;padding:13px 10px;
                              border-radius:10px;font-size:14px;font-weight:800;
                              text-align:center;box-shadow:0 4px 14px rgba(3,105,161,0.4);">
                      👮 Police 100
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;
                            margin-bottom:26px;border-collapse:collapse;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;
                                 letter-spacing:.09em;color:#64748b;">Person in Danger</span><br/>
                    <span style="font-size:16px;font-weight:800;color:#dc2626;">${user.name}</span>
                  </td>
                </tr>
                ${relationship ? `
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;
                                 letter-spacing:.09em;color:#64748b;">Your Relationship</span><br/>
                    <span style="font-size:15px;font-weight:700;color:#0f172a;">${relationship}</span>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;
                                 letter-spacing:.09em;color:#64748b;">Alert Time</span><br/>
                    <span style="font-size:15px;font-weight:600;color:#0f172a;">
                      ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;
                                 letter-spacing:.09em;color:#64748b;">GPS Coordinates</span><br/>
                    <span style="font-size:15px;font-weight:600;color:#0f172a;">
                      ${lat && lng ? `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}` : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Location button -->
              ${locationLink ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
                <tr>
                  <td align="center">
                    <a href="${locationLink}"
                       style="display:inline-block;
                              background:linear-gradient(135deg,#16a34a,#15803d);
                              color:#fff;text-decoration:none;padding:16px 40px;
                              border-radius:10px;font-size:16px;font-weight:800;
                              box-shadow:0 6px 20px rgba(22,163,74,0.45);">
                      🗺️ Get Directions to ${user.name}
                    </a>
                  </td>
                </tr>
              </table>` : `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
                <tr>
                  <td align="center"
                      style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                             padding:16px 20px;font-size:14px;color:#64748b;">
                    📍 Live location was unavailable. Call ${user.name} directly.
                  </td>
                </tr>
              </table>`}

              <!-- Action steps -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;
                            margin-bottom:26px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:800;
                               text-transform:uppercase;letter-spacing:.1em;color:#c2410c;">
                      🔴 What to do RIGHT NOW
                    </p>
                    <ol style="margin:0;padding-left:18px;font-size:14px;color:#431407;line-height:2.1;">
                      <li><strong>Call ${user.name} immediately</strong></li>
                      <li>If no answer, go to their location using the button above</li>
                      <li>Call emergency services: <strong>Police — 100 | Emergency — 112</strong></li>
                      <li>Share the Google Maps link with emergency responders</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Severity badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <span style="display:inline-block;background:#dc2626;color:#fff;
                                 font-size:12px;font-weight:800;text-transform:uppercase;
                                 letter-spacing:.1em;padding:6px 18px;border-radius:999px;">
                      🔴 Severity: CRITICAL — Respond Immediately
                    </span>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#94a3b8;line-height:1.65;margin:0;">
                This alert was sent automatically by <strong>SafeHer</strong>
                because ${user.name} listed you as an emergency contact.
                Do not reply to this email — contact ${user.name} directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                SafeHer — Because every woman deserves to feel safe, everywhere, always. 💜
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Send alert emails to a set of contacts ──────────────────────────────────
function sendAlertEmails(contacts, user, lat, lng, isEscalation = false) {
  return contacts
    .filter((c) => c.email)
    .map((c) => {
      const relationship = c.relationship ? c.relationship.trim() : null;
      const subject = isEscalation
        ? `🚨 ESCALATED — ${user.name} needs help NOW! (SafeHer SOS)`
        : relationship
        ? `🚨 URGENT — ${user.name} needs help NOW! (SafeHer SOS · ${relationship})`
        : `🚨 URGENT — ${user.name} has triggered an Emergency SOS Alert!`;

      return transporter
        .sendMail({
          from: `"SafeHer Emergency Alert" <${process.env.EMAIL_USER}>`,
          to: c.email,
          subject,
          html: buildSosEmailHtml(user, c, lat, lng, isEscalation),
        })
        .then(() => console.log(`✅ ${isEscalation ? 'Escalation' : ''} Email sent to ${c.name} <${c.email}>`))
        .catch((err) => console.error(`❌ Email failed for ${c.email}:`, err.message));
    });
}

// ── CREATE INCIDENT (SOS trigger) ───────────────────────────────────────────
exports.createIncident = async (req, res) => {
  const { lat, lng } = req.body;
  try {
    // Fetch the user's emergency contacts
    const allContacts = await EmergencyContact.find({ user: req.user.id });
    const tier1 = allContacts;
    const tier2 = []; // Escalation disabled as priority feature is removed

    const incident = new Incident({
      user: req.user.id,
      location: { lat, lng },
      contactsNotified: tier1.map((c) => c._id),
      escalationStatus: 'cancelled', // Escalation not used without priorities
    });
    await incident.save();

    const user = await User.findById(req.user.id);

    // ── Send emails to Tier 1 contacts immediately ──────────────────────
    const emailPromises = sendAlertEmails(tier1, user, lat, lng, false);
    await Promise.all(emailPromises);

    // ── Schedule Tier 2 escalation ──────────────────────────────────────
    if (tier2.length > 0) {
      const timerId = setTimeout(async () => {
        try {
          // Re-check: only escalate if status is still 'pending'
          const freshIncident = await Incident.findById(incident._id);
          if (!freshIncident || freshIncident.escalationStatus !== 'pending') {
            escalationTimers.delete(incident._id.toString());
            return;
          }

          // Send escalation emails to Tier 2
          const escalationPromises = sendAlertEmails(tier2, user, lat, lng, true);
          await Promise.all(escalationPromises);

          // Update incident
          freshIncident.escalationStatus = 'escalated';
          freshIncident.escalatedAt = new Date();
          freshIncident.contactsEscalated = tier2.map((c) => c._id);
          await freshIncident.save();

          console.log(`⬆️ Escalation fired for incident ${incident._id} — ${tier2.length} tier-2 contacts notified`);
        } catch (err) {
          console.error('Escalation error:', err.message);
        } finally {
          escalationTimers.delete(incident._id.toString());
        }
      }, ESCALATION_DELAY_MS);

      escalationTimers.set(incident._id.toString(), timerId);
    }

    res.json({
      incident,
      message: `Alert sent to ${tier1.length} primary contact(s)${tier2.length > 0 ? `. ${tier2.length} secondary contact(s) will be escalated in 3 minutes.` : ''}`,
      tier1Count: tier1.length,
      tier2Count: tier2.length,
      escalationPending: tier2.length > 0,
    });
  } catch (err) {
    console.error('createIncident error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ── GET INCIDENTS (history, server-side pagination) ──────────────────────────
exports.getIncidents = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));

    const [total, incidents] = await Promise.all([
      Incident.countDocuments({ user: req.user.id }),
      Incident
        .find({ user: req.user.id })
        .populate('contactsNotified', 'name phone')
        .populate('contactsEscalated', 'name phone')
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ incidents, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// ── SEND ALL-CLEAR (false alarm / cancel escalation) ─────────────────────────
exports.sendAllClear = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user.id });
    const user = await User.findById(req.user.id);

    // Cancel any pending escalation timer for the user's most recent incident
    const latestIncident = await Incident.findOne({ user: req.user.id }).sort({ timestamp: -1 });
    if (latestIncident && latestIncident.escalationStatus === 'pending') {
      const timerId = escalationTimers.get(latestIncident._id.toString());
      if (timerId) {
        clearTimeout(timerId);
        escalationTimers.delete(latestIncident._id.toString());
        console.log(`🛑 Escalation cancelled for incident ${latestIncident._id}`);
      }
      latestIncident.escalationStatus = 'cancelled';
      latestIncident.allClearAt = new Date();
      await latestIncident.save();
    }

    const emailPromises = contacts
      .filter((c) => c.email)
      .map((c) =>
        transporter
          .sendMail({
            from: `"SafeHer" <${process.env.EMAIL_USER}>`,
            to: c.email,
            subject: `✅ ALL CLEAR — ${user.name} is safe (SafeHer)`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f0fdf4;border-radius:12px;overflow:hidden">
                <div style="background:#16a34a;padding:24px 32px;color:#fff">
                  <h2 style="margin:0">✅ All Clear — ${user.name} is safe</h2>
                </div>
                <div style="padding:28px 32px;color:#1a2e1a">
                  <p>Hi <strong>${c.name}</strong>,</p>
                  <p>
                    This is an automated message from <strong>SafeHer</strong>.
                    <strong>${user.name}</strong> has confirmed they are <strong>safe</strong>.
                    The earlier SOS alert was a false alarm — no action is required.
                  </p>
                  <p style="color:#6b7280;font-size:0.85rem">If you have any concerns, please contact ${user.name} directly.</p>
                </div>
                <div style="background:#dcfce7;padding:12px 32px;font-size:0.78rem;color:#16a34a">
                  Sent via SafeHer Emergency Platform
                </div>
              </div>`,
          })
          .catch((err) => console.error(`All-clear email failed for ${c.email}:`, err.message))
      );

    await Promise.all(emailPromises);
    res.json({ msg: `All-clear sent to ${contacts.filter(c => c.email).length} contact(s)` });
  } catch (err) {
    console.error('sendAllClear error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
