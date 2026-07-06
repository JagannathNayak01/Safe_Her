import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Siren, MapPin, Users, CheckCircle2, XCircle, Loader2, X, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const STAGES = { CONFIRM: 'confirm', LOCATING: 'locating', SENDING: 'sending', SUCCESS: 'success', ERROR: 'error' };

export default function SosAlertModal({ open, onClose }) {
  const { addToast } = useContext(ToastContext);
  const [stage, setStage] = useState(STAGES.CONFIRM);
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [allClearSent, setAllClearSent] = useState(false);
  const [allClearLoading, setAllClearLoading] = useState(false);
  const [escalationPending, setEscalationPending] = useState(false);
  const [escalationTimer, setEscalationTimer] = useState(0);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => setStage(STAGES.CONFIRM), 300);
  }, [onClose]);

  const canClose = stage === STAGES.CONFIRM || stage === STAGES.SUCCESS || stage === STAGES.ERROR;
  const trapRef = useFocusTrap(open, canClose ? handleClose : undefined);

  const fetchContacts = useCallback(async () => {
    if (!localStorage.getItem('safeher_logged_in')) return; // not logged in — skip silently
    setLoadingContacts(true);
    try {
      const { data } = await API.get('/emergency-contacts');
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStage(STAGES.CONFIRM);
      setLocation(null);
      setErrorMsg('');
      setAllClearSent(false);
      setAllClearLoading(false);
      fetchContacts();
    }
  }, [open, fetchContacts]);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null), // allow sending without location
        { timeout: 6000 }
      );
    });

  // ── Demo SMS via native sms: URI (opens messaging app) ──────────────────
  // TODO: Replace with Twilio API integration for production
  // const sendSMSViaTwilio = async (contacts, userName, locationLink) => {
  //   // Example Twilio integration:
  //   // await API.post('/send-sms', { contacts, userName, locationLink });
  // };

  const sendSMSToContacts = (contactsList, userName, loc) => {
    const locationLink = loc
      ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
      : '';
    const message = `🚨 EMERGENCY SOS ALERT!\n\n${userName} has triggered an emergency SOS on SafeHer and needs your help IMMEDIATELY!\n\n${locationLink ? `📍 Location: ${locationLink}\n\n` : ''}Please call them RIGHT NOW or contact emergency services.\n🚨 Police: 100 | Emergency: 112`;

    // Open native SMS app for contacts that have phone numbers
    const phoneContacts = contactsList.filter((c) => c.phone);
    if (phoneContacts.length > 0) {
      // Use the first contact's number to open SMS app
      // On mobile, this opens the default messaging app pre-filled
      const numbers = phoneContacts.map((c) => c.phone).join(',');
      window.location.href = `sms:${numbers}?body=${encodeURIComponent(message)}`;
    }
  };

  const handleSendSOS = useCallback(async () => {
    // Guard: must be logged in
    if (!localStorage.getItem('safeher_logged_in')) {
      setErrorMsg('You must be logged in to send an SOS alert.');
      setStage(STAGES.ERROR);
      return;
    }

    setStage(STAGES.LOCATING);
    const loc = await getLocation();
    setLocation(loc);

    setStage(STAGES.SENDING);
    try {
      const res = await API.post('/incidents', {
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
      });

      // Send SMS to contacts via native messaging app (demo)
      // TODO: Replace with Twilio for production — see commented code above
      const userName = localStorage.getItem('safeher_user_name') || 'A SafeHer user';
      sendSMSToContacts(contacts, userName, loc);

      // Track escalation info
      if (res?.data?.escalationPending) {
        setEscalationPending(true);
        setEscalationTimer(180); // 3 minutes
      }

      setStage(STAGES.SUCCESS);
    } catch (err) {
      setErrorMsg(err?.response?.data?.msg || err?.response?.data?.message || 'Failed to send SOS. Please try again.');
      setStage(STAGES.ERROR);
    }
  }, [contacts]);

  const handleSendAllClear = useCallback(async () => {
    setAllClearLoading(true);
    try {
      await API.post('/incidents/all-clear');
      setAllClearSent(true);
      addToast('✅ All-clear sent — contacts notified you are safe!', 'success');
    } catch (err) {
      addToast('❌ Failed to send all-clear. Please try again.', 'error');
    } finally {
      setAllClearLoading(false);
    }
  }, [addToast]);



  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      onClick={stage === STAGES.SUCCESS || stage === STAGES.ERROR ? handleClose : undefined}
      style={{ zIndex: 9999 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-modal-title"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="sos-modal-box"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {(stage === STAGES.CONFIRM || stage === STAGES.SUCCESS || stage === STAGES.ERROR) && (
            <button className="sos-modal-close" onClick={handleClose} aria-label="Close">
              <X size={16} />
            </button>
          )}

          {/* ── CONFIRM stage ── */}
          {stage === STAGES.CONFIRM && (
            <div className="sos-stage">
              <div className="sos-icon-ring sos-icon-ring--red">
                <Siren size={28} />
              </div>
              <h3 id="sos-modal-title" className="sos-title">Send SOS Alert?</h3>
              <p className="sos-subtitle">
                Your current location will be shared with your emergency contacts immediately.
              </p>

              {/* Contacts preview */}
              <div className="sos-contacts-box">
                <div className="sos-contacts-header">
                  <Users size={14} />
                  <span>
                    {loadingContacts
                      ? 'Loading contacts…'
                      : contacts.length === 0
                      ? 'No emergency contacts saved'
                      : `Notifying ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {contacts.slice(0, 3).map((c) => (
                  <div key={c._id} className="sos-contact-row">
                    <span className="sos-contact-avatar">{c.name?.[0]?.toUpperCase()}</span>
                    <div>
                      <div className="sos-contact-name">{c.name}</div>
                      <div className="sos-contact-phone">{c.phone}</div>
                    </div>
                  </div>
                ))}
                {contacts.length > 3 && (
                  <p className="sos-contacts-more">+{contacts.length - 3} more</p>
                )}
              </div>

              {contacts.length === 0 && !loadingContacts && (
                <div className="sos-warning">
                  <AlertTriangle size={14} />
                  <span>Add emergency contacts first for alerts to be received.</span>
                </div>
              )}

              <div className="sos-actions">
                <button className="sos-btn-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button className="sos-btn-send" onClick={handleSendSOS}>
                  <Siren size={16} />
                  Send SOS Now
                </button>
              </div>
            </div>
          )}

          {/* ── LOCATING stage ── */}
          {stage === STAGES.LOCATING && (
            <div className="sos-stage sos-stage--center">
              <div className="sos-icon-ring sos-icon-ring--blue sos-pulse">
                <MapPin size={28} />
              </div>
              <h3 className="sos-title">Getting your location…</h3>
              <p className="sos-subtitle">Please allow location access for accurate alerts.</p>
              <Loader2 size={22} className="sos-spinner" />
            </div>
          )}

          {/* ── SENDING stage ── */}
          {stage === STAGES.SENDING && (
            <div className="sos-stage sos-stage--center">
              <div className="sos-icon-ring sos-icon-ring--orange sos-pulse">
                <Siren size={28} />
              </div>
              <h3 className="sos-title">Sending alert…</h3>
              <p className="sos-subtitle">Notifying your emergency contacts now.</p>
              <Loader2 size={22} className="sos-spinner" />
            </div>
          )}

          {stage === STAGES.SUCCESS && (
            <div className="sos-stage sos-stage--center">
              <div className="sos-icon-ring sos-icon-ring--green">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="sos-title sos-title--green">Alert Sent!</h3>
              <p className="sos-subtitle">
                {contacts.length > 0
                  ? `${contacts.length} emergency contact${contacts.length > 1 ? 's have' : ' has'} been notified.`
                  : 'Your SOS alert has been recorded.'}
              </p>
              {location && (
                <a
                  href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sos-location-link"
                >
                  <MapPin size={13} /> View shared location
                </a>
              )}
              {/* Escalation countdown */}
              {escalationPending && !allClearSent && (
                <div className="sos-escalation-info">
                  <Clock size={14} />
                  <span>Secondary contacts will be alerted in ~3 minutes</span>
                </div>
              )}

              {/* All-Clear / False Alarm button */}
              {!allClearSent ? (
                <button
                  className="sos-btn-allclear"
                  onClick={handleSendAllClear}
                  disabled={allClearLoading}
                  title="Notify contacts that you are safe and cancel escalation"
                >
                  {allClearLoading
                    ? <><Loader2 size={14} className="sos-spinner" /> Sending all-clear…</>
                    : <><ShieldCheck size={14} /> I'm Safe — Cancel Escalation</>}
                </button>
              ) : (
                <p className="sos-allclear-sent">
                  <ShieldCheck size={14} /> All-clear sent — escalation cancelled!
                </p>
              )}
              <button className="sos-btn-done" onClick={handleClose}>
                Done
              </button>
            </div>
          )}

          {/* ── ERROR stage ── */}
          {stage === STAGES.ERROR && (
            <div className="sos-stage sos-stage--center">
              <div className="sos-icon-ring sos-icon-ring--red">
                <XCircle size={28} />
              </div>
              <h3 className="sos-title sos-title--red">Failed to Send</h3>
              <p className="sos-subtitle">{errorMsg}</p>
              <div className="sos-actions">
                <button className="sos-btn-cancel" onClick={handleClose}>
                  Close
                </button>
                <button className="sos-btn-send" onClick={handleSendSOS}>
                  Retry
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
