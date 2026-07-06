import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, Save, Eye, EyeOff, ShieldCheck, Camera, Trash2, Loader2, Maximize2, X } from 'lucide-react';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';
import { ProfileSkeleton } from '../common/Skeleton';
import useFocusTrap from '../../hooks/useFocusTrap';

const BACKEND = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { addToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);

  /* ── Profile info state ── */
  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [phone,  setPhone]  = useState('');
  const [avatar, setAvatar] = useState('');       // URL returned by backend
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const lightboxTrapRef = useFocusTrap(showLightbox, () => setShowLightbox(false));
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* ── Password state ── */
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null); // tracks which pw field is focused

  /* ── Load current profile on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/profile');
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone || '');
        setAvatar(data.avatarBase64 || data.avatar || '');
        // keep localStorage in sync so Navbar stays current on refresh
        localStorage.setItem('userName',    data.name);
        localStorage.setItem('userAvatar',  data.avatarBase64 || data.avatar || '');
      } catch {
        addToast('❌ Could not load profile', 'error');
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  /* ── Avatar upload ── */
  const MAX_AVATAR_SIZE_MB = 2;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Client-side guards (fast failure before any network request) ──
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast('❌ Only JPG, PNG, GIF or WebP images are allowed', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      addToast(`❌ Image must be under ${MAX_AVATAR_SIZE_MB} MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB)`, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setAvatar(localUrl);

    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await API.post('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Prefer base64 (from DB) so the avatar works even if static server changes
      const display = data.avatarBase64 || data.avatar;
      setAvatar(display);
      localStorage.setItem('userAvatar', display);
      // Notify Navbar to re-read the avatar from state
      window.dispatchEvent(new CustomEvent('safeher:avatar-updated', { detail: { avatar: display } }));
      addToast('✅ Profile picture updated!', 'success');
    } catch (err) {
      addToast(`❌ ${err.response?.data?.msg || 'Upload failed'}`, 'error');
      setAvatar('');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Remove avatar ── */
  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await API.delete('/profile/avatar');
      setAvatar('');
      localStorage.removeItem('userAvatar');
      window.dispatchEvent(new CustomEvent('safeher:avatar-updated', { detail: { avatar: '' } }));
      addToast('✅ Profile picture removed', 'success');
    } catch (err) {
      addToast(`❌ ${err.response?.data?.msg || 'Failed to remove'}`, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ── Save name / email ── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { data } = await API.put('/profile', { name, email, phone });
      localStorage.setItem('userName', data.name);
      // Notify Navbar to update the displayed name live
      window.dispatchEvent(new CustomEvent('safeher:name-updated', { detail: { name: data.name } }));
      addToast(`✅ ${data.msg || 'Profile updated!'}`, 'success');
    } catch (err) {
      addToast(`❌ ${err.response?.data?.msg || 'Failed to update profile'}`, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  /* ── Change password ── */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('❌ New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('❌ Password must be at least 6 characters', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      const { data } = await API.put('/profile/password', { currentPassword, newPassword });
      addToast(`✅ ${data.msg || 'Password changed!'}`, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(`❌ ${err.response?.data?.msg || 'Failed to change password'}`, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ── Avatar display src ──
   *  - blob:  → local preview, use as-is
   *  - data:  → base64 from DB, use as-is
   *  - /...   → disk path, prepend backend origin
   */
  const avatarSrc = avatar
    ? (avatar.startsWith('blob:') || avatar.startsWith('data:')
        ? avatar
        : `${BACKEND}${avatar}`)
    : null;
  const initial = name ? name.trim()[0].toUpperCase() : '?';

  const cardVariants = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };

  /* ── Password strength scorer ── */
  const getPwStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    score = Math.min(score, 4);
    const levels = [
      { label: 'Weak',      color: '#ef4444' },
      { label: 'Fair',      color: '#f59e0b' },
      { label: 'Good',      color: '#06b6d4' },
      { label: 'Strong',    color: '#22c55e' },
      { label: 'Very Strong', color: '#16a34a' },
    ];
    return { score, ...levels[score] };
  };

  if (profileLoading) {
    return (
      <div className="page profile-page">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="page profile-page">

      {/* ── Header ── */}
      <motion.div
        className="profile-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Clickable avatar with camera overlay ── */}
        <div className="profile-avatar-wrap">
          {avatarSrc ? (
            <div className="profile-avatar-clickable" onClick={() => setShowLightbox(true)} title="Click to enlarge">
              <img src={avatarSrc} alt="Profile" className="profile-avatar profile-avatar--img" />
              <div className="profile-avatar-enlarge-hint">
                <Maximize2 size={14} />
              </div>
            </div>
          ) : (
            <div className="profile-avatar">{initial}</div>
          )}

          {/* Camera overlay button */}
          <button
            type="button"
            className="profile-avatar-camera"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            title="Change profile picture"
          >
            {avatarUploading ? (
              <span className="profile-avatar-spinner" />
            ) : (
              <Camera size={14} />
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <h2 className="profile-title">{name}</h2>
          <p className="profile-subtitle">{email}</p>
          {avatar && (
            <button
              type="button"
              className="profile-remove-avatar-btn"
              onClick={handleRemoveAvatar}
              disabled={avatarUploading}
            >
              <Trash2 size={12} /> Remove photo
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Avatar Lightbox ── */}
      <AnimatePresence>
        {showLightbox && avatarSrc && (
          <motion.div
            className="profile-lightbox-overlay"
            onClick={() => setShowLightbox(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="profile-lightbox-content"
              ref={lightboxTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Enlarged profile picture"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <button
                className="profile-lightbox-close"
                onClick={() => setShowLightbox(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <img src={avatarSrc} alt="Profile enlarged" className="profile-lightbox-img" />
              <p className="profile-lightbox-name">{name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Personal Info Card ── */}
      <motion.div
        className="profile-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="profile-card-header">
          <ShieldCheck size={20} className="profile-card-icon" />
          <h3>Personal Information</h3>
        </div>

        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="profile-field">
            <label htmlFor="profile-name"><User size={15} /> Full Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email"><Mail size={15} /> Email Address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="profile-field-hint">This email appears as the sender name in SOS alerts.</p>
          </div>

          <div className="profile-field">
            <label htmlFor="profile-phone"><Phone size={15} /> Phone Number <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
            <p className="profile-field-hint">Added to SOS emails so contacts can call you with one tap.</p>
          </div>

          <motion.button
            type="submit"
            className={`profile-save-btn${profileSaving ? ' btn-loading' : ''}`}
            disabled={profileSaving}
            whileHover={{ scale: profileSaving ? 1 : 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {profileSaving ? <Loader2 size={16} className="sos-spinner" /> : <Save size={16} />}
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Change Password Card ── */}
      <motion.div
        className="profile-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="profile-card-header">
          <Lock size={20} className="profile-card-icon profile-card-icon--violet" />
          <h3>Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="profile-form">
          {[
            { id: 'current-password', label: 'Current Password', val: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: setShowCurrent },
            { id: 'new-password',     label: 'New Password',     val: newPassword,      set: setNewPassword,      show: showNew,     toggle: setShowNew, hint: 'Min 6 characters' },
            { id: 'confirm-password', label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: setShowConfirm },
          ].map(({ id, label, val, set, show, toggle, hint }) => (
            <div className="profile-field" key={id}>
              <label htmlFor={id}>{label}</label>
              <div className="profile-input-wrap">
                <input
                  id={id}
                  type={show ? 'text' : 'password'}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  onFocus={() => setFocusedField(id)}
                  onBlur={() => setFocusedField(null)}
                  placeholder={hint || '••••••••'}
                  required
                />
                <button type="button" className="profile-eye-btn" onClick={() => toggle((v) => !v)} tabIndex={-1}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {id === 'confirm-password' && val && (
                <p className="profile-field-hint" style={{ color: newPassword === val ? '#22c55e' : '#ef4444' }}>
                  {newPassword === val ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
              {id === 'new-password' && val && focusedField === 'new-password' && (() => {
                const s = getPwStrength(val);
                if (!s) return null;
                const legend = [
                  { label: 'Weak',        color: '#ef4444', emoji: '🔴' },
                  { label: 'Fair',        color: '#f59e0b', emoji: '🟡' },
                  { label: 'Good',        color: '#06b6d4', emoji: '🔵' },
                  { label: 'Strong',      color: '#22c55e', emoji: '🟢' },
                  { label: 'Very Strong', color: '#16a34a', emoji: '🟢' },
                ];
                return (
                  <div className="pw-strength-popup">
                    {/* 4-segment progress bar */}
                    <div className="pw-strength-bar">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="pw-strength-seg"
                          style={{ background: i < s.score ? s.color : undefined }}
                        />
                      ))}
                    </div>
                    {/* Current tier label */}
                    <p className="pw-strength-current" style={{ color: s.color }}>
                      {s.label}
                    </p>
                    {/* Legend table */}
                    <table className="pw-strength-legend">
                      <tbody>
                        {legend.map(row => (
                          <tr
                            key={row.label}
                            style={{ opacity: s.label === row.label ? 1 : 0.38 }}
                          >
                            <td className="pw-legend-emoji">{row.emoji}</td>
                            <td
                              className="pw-legend-label"
                              style={{
                                color: s.label === row.label ? row.color : undefined,
                                fontWeight: s.label === row.label ? 700 : 500,
                              }}
                            >
                              {row.label}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ))}

          <motion.button
            type="submit"
            className={`profile-save-btn profile-save-btn--violet${passwordSaving ? ' btn-loading' : ''}`}
            disabled={passwordSaving}
            whileHover={{ scale: passwordSaving ? 1 : 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {passwordSaving ? <Loader2 size={16} className="sos-spinner" /> : <Lock size={16} />}
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
