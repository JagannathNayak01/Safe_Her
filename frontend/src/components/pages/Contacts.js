import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Edit2, Trash2, X, Clock3, Users, ShieldAlert, Wifi, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/api';
import { ToastContext } from '../../context/ToastContext';
import { SkeletonTableRow } from '../common/Skeleton';
import GlassLoader from '../common/GlassLoader';
import useFocusTrap from '../../hooks/useFocusTrap';

/* ─── Inline data ─── */
const escalationLevels = [
  {
    threshold: '0 – 60 seconds',
    title: 'Immediate Contact Alert',
    description: 'Primary emergency contact receives a push notification + SMS with your live location pinned on a map.',
  },
  {
    threshold: '60 – 180 seconds (no response)',
    title: 'Secondary Contact Escalation',
    description: 'If the primary contact does not acknowledge within 60 s, the workflow automatically forwards the alert to the next contact in the list.',
  },
  {
    threshold: '180 s+ · No acknowledgement',
    title: 'Authorities & Fallback',
    description: 'After 3 minutes with no acknowledgment, the system triggers a call-based alert and optionally notifies local emergency services with your coordinates.',
  },
];


/* Animated trash-can confirm button for the delete popup */
function AnimatedConfirmButton({ onConfirm }) {
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const handleClick = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    // Run the full 3.2 s animation, then fire the actual delete
    timerRef.current = setTimeout(() => {
      setAnimating(false);
      onConfirm();
    }, 3200);
  }, [animating, onConfirm]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <button
      type="button"
      className={`confirmBtn${animating ? ' delete' : ''}`}
      onClick={handleClick}
    >
      <div className="trash">
        <div className="top">
          <div className="paper" />
        </div>
        <div className="box" />
        <div className="check">
          <svg viewBox="0 0 8 6">
            <polyline points="1 3.4 2.71428571 5 7 1" />
          </svg>
        </div>
      </div>
      <span>Yes, Delete</span>
    </button>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [contactId, setContactId] = useState('');
  const [address, setAddress] = useState('');
  const [relationship, setRelationship] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formModal, setFormModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const itemsPerPage = 5;
  const { addToast } = useContext(ToastContext);
  const headingRef = useRef(null);

  // Focus-trap refs for modals
  const formTrapRef = useFocusTrap(formModal, () => setFormModal(false));
  const deleteTrapRef = useFocusTrap(modalVisible, () => setModalVisible(false));
  const bulkDeleteTrapRef = useFocusTrap(bulkDeleteModal, () => setBulkDeleteModal(false));

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await API.get('/emergency-contacts');
      setContacts(res.data);
    } catch (err) {
      addToast('❌ Failed to fetch contacts', 'error');
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!headingRef.current) return;
    const originalHTML = headingRef.current.innerHTML;
    let cleanup;
    import('https://esm.sh/animejs').then(({ createTimeline, stagger, splitText }) => {
      if (!headingRef.current) return;
      const { chars } = splitText(headingRef.current, {
        chars: { wrap: 'clip', clone: 'bottom' },
      });
      const tl = createTimeline()
        .add(chars, {
          y: '-100%',
          loop: true,
          loopDelay: 2950,
          duration: 1050,
          ease: 'inOut(2)',
        }, stagger(150, { from: 'left' }));
      cleanup = () => tl.pause();
    });
    return () => {
      if (cleanup) cleanup();
      // Restore original HTML so re-mount starts clean
      if (headingRef.current) headingRef.current.innerHTML = originalHTML;
    };
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    const aValue = a[sortColumn] || '';
    const bValue = b[sortColumn] || '';
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Filter contacts (search across all fields)
  const filteredContacts = sortedContacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.relationship && c.relationship.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  const pageCount = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelectedOnPage =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.includes(c._id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = (checked) => {
    const idsOnPage = paginatedContacts.map((c) => c._id);
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...idsOnPage]));
      }
      return prev.filter((id) => !idsOnPage.includes(id));
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      const contactData = { name, phone, email, gender, id: contactId, address, relationship };
      if (isEditing) {
        await API.put(`/emergency-contacts/${editId}`, contactData);
        addToast('✅ Contact updated successfully!', 'success');
      } else {
        await API.post('/emergency-contacts', contactData);
        addToast('✅ Contact added successfully!', 'success');
      }
      setName('');
      setPhone('');
      setEmail('');
      setGender('');
      setContactId('');
      setAddress('');
      setRelationship('');
      setIsEditing(false);
      setEditId(null);
      setFormModal(false);
      fetchContacts();
    } catch (err) {
      const message = err.response?.data?.msg || (isEditing ? 'Failed to update contact' : 'Failed to add contact');
      addToast('❌ ' + message, 'error');
    } finally {
      setFormSaving(false);
    }
  };


  const handleEdit = (id, name, phone, email, gender, contactId, address, relationship) => {
    setName(name);
    setPhone(phone);
    setEmail(email || '');
    setGender(gender || '');
    setContactId(contactId || '');
    setAddress(address || '');
    setRelationship(relationship || '');
    setEditId(id);
    setIsEditing(true);
    setFormModal(true);
  };

  const handleDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);

    try {
      const res = await API.delete(`/emergency-contacts/${deleteId}`);
      addToast('✅ Contact deleted!', 'success');

      // Keep the row visible for the animation duration before removing
      setTimeout(() => {
        setContacts((prev) => prev.filter((c) => c._id !== deleteId));
        setDeletingId(null);
      }, 250);
    } catch (err) {
      console.error('Delete failed', err);
      const message =
        err.response?.data?.message || err.response?.data?.msg || err.message || 'Unknown error';
      addToast(`❌ Failed to delete contact: ${message}`, 'error');
      setDeletingId(null);
      // restore UI to correct state
      fetchContacts();
    } finally {
      setModalVisible(false);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  /* ── Bulk delete all selected contacts ── */
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteModal(false);
    try {
      await Promise.all(selectedIds.map((id) => API.delete(`/emergency-contacts/${id}`)));
      addToast(`✅ ${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''} deleted!`, 'success');
      setSelectedIds([]);
      fetchContacts();
    } catch (err) {
      addToast('❌ Failed to delete some contacts. Please try again.', 'error');
      fetchContacts();
    }
  };

  return (
    <>
      {/* Form Modal — outside .page so position:fixed is viewport-relative */}
      <AnimatePresence>
        {formModal && (
          <motion.div
            className="modalOverlay"
            onClick={() => setFormModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="container2"
              ref={formTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label={isEditing ? 'Edit Contact' : 'New Contact'}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <button className="close-btn" type="button" onClick={() => setFormModal(false)}>
                <X size={18} />
              </button>
              <h2>{isEditing ? 'Edit Contact' : 'New Contact'}</h2>
              <form onSubmit={handleAdd} className="contact-form">
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="flex-row">
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    name="relationship"
                    id="relationship"
                    placeholder="Relationship (e.g. Mother, Friend, Husband)"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                  />
                </div>

                <label className="gender-label">Gender</label>
                <div className="gender-toggle">
                  <input
                    type="radio"
                    name="gender"
                    id="male"
                    value="Male"
                    checked={gender === 'Male'}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />
                  <label htmlFor="male">Male</label>

                  <input
                    type="radio"
                    name="gender"
                    id="female"
                    value="Female"
                    checked={gender === 'Female'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <label htmlFor="female">Female</label>

                  <input
                    type="radio"
                    name="gender"
                    id="other"
                    value="Other"
                    checked={gender === 'Other'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <label htmlFor="other">Other</label>

                  <span className="toggle-indicator" />
                </div>

                <input
                  type="text"
                  name="address"
                  id="address"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <button type="submit" className={`adduser${formSaving ? ' btn-loading' : ''}`} disabled={formSaving}>
                  {formSaving ? (
                    <><Loader2 size={15} className="sos-spinner" /> {isEditing ? 'Updating…' : 'Adding…'}</>
                  ) : (
                    isEditing ? 'Update Contact' : 'Add Contact'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {modalVisible && (
          <motion.div
            className="modalOverlay"
            onClick={() => setModalVisible(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="modalBox"
              ref={deleteTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Delete contact confirmation"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            >
              <h3>Delete Contact</h3>
              <p>Are you sure you want to delete <strong>{deleteName}</strong>?</p>
              <div className="modalButtons">
                <AnimatedConfirmButton onConfirm={confirmDelete} />
                <button className="cancelBtn" onClick={() => setModalVisible(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk Delete Confirmation Modal ── */}
      <AnimatePresence>
        {bulkDeleteModal && (
          <motion.div
            className="modalOverlay"
            onClick={() => setBulkDeleteModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              className="modalBox"
              ref={bulkDeleteTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Bulk delete confirmation"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            >
              <h3>Delete Selected Contacts</h3>
              <p>Are you sure you want to delete <strong>{selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''}</strong>? This cannot be undone.</p>
              <div className="modalButtons">
                <AnimatedConfirmButton onConfirm={confirmBulkDelete} />
                <button className="cancelBtn" onClick={() => setBulkDeleteModal(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page contacts">
        <h2 ref={headingRef}>Emergency Contacts</h2>

        {/* ── Stats bar ─────────────────────────────────── */}
        <motion.div
          className="contacts-stats-bar"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <div className="contacts-stat">
            <span className="contacts-stat-value">{contacts.length}</span>
            <span className="contacts-stat-label">Total Contacts</span>
          </div>
          <div className="contacts-stat-divider" />
          <div className="contacts-stat">
            <span className="contacts-stat-value">{filteredContacts.length}</span>
            <span className="contacts-stat-label">Showing</span>
          </div>
          <div className="contacts-stat-divider" />
          <div className="contacts-stat">
            <span className="contacts-stat-value">{selectedIds.length}</span>
            <span className="contacts-stat-label">Selected</span>
          </div>
          {selectedIds.length > 0 && (
            <>
              <div className="contacts-stat-divider" />
              <button
                onClick={handleBulkDelete}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.35rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ef444460',
                  background: '#ef444415',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'background 0.2s',
                }}
                aria-label={`Delete ${selectedIds.length} selected contacts`}
              >
                <Trash2 size={13} /> Delete {selectedIds.length} selected
              </button>
            </>
          )}
        </motion.div>

        {/* Contacts Table */}
        <motion.div
          className="custom-table-wrapper"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
        >
          <div className="table-header">
            <h5 className="employee-title">Contact List</h5>
            <div className="header-controls">
              <motion.button
                className="btn btn-add-rect"
                onClick={() => setFormModal(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                + Add Contact
              </motion.button>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-responsive glass-table shadow-sm rounded">
            <table className="table custom-table align-middle mb-0">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead className="bg-light text-dark">
                <tr>
                  <th className="select-column" title="Select / Deselect all">
                    <input
                      type="checkbox"
                      checked={isAllSelectedOnPage}
                      onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                      aria-label="Select all"
                    />
                  </th>
                  <th title="Contact name" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Name <span className="sort-icon">{sortColumn === 'name' ? (sortDirection === 'asc' ? '⬍' : '⬆') : '⬍'}</span>
                  </th>
                  <th title="Phone number" onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>
                    Phone <span className="sort-icon">{sortColumn === 'phone' ? (sortDirection === 'asc' ? '⬍' : '⬆') : '⬍'}</span>
                  </th>
                  <th title="Email address" onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email <span className="sort-icon">{sortColumn === 'email' ? (sortDirection === 'asc' ? '⬍' : '⬆') : '⬍'}</span>
                  </th>
                  <th title="Gender">Gender</th>
                  <th title="Relationship to you">Relationship</th>
                  <th title="Address">Address</th>
                  <th className="text-center" title="Actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contactsLoading ? (
                  /* Skeleton rows while loading */
                  <>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)}</>
                ) : paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                        <span style={{ fontSize: '2.5rem' }}>👥</span>
                        <p style={{ margin: 0, fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>
                          {searchTerm ? 'No contacts match your search' : 'No emergency contacts yet'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.82rem' }}>
                          {searchTerm ? 'Try a different search term.' : 'Click “+ Add Contact” to add your first trusted contact.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((c, rowIdx) => (
                    <motion.tr
                      key={c._id}
                      className={`${selectedIds.includes(c._id) ? 'selected-row' : ''} ${deletingId === c._id ? 'deleting-row' : ''}`.trim()}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 18 }}
                      transition={{ duration: 0.28, delay: rowIdx * 0.055 }}
                      layout
                    >
                      <td className="select-cell">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c._id)}
                          onChange={() => toggleSelect(c._id)}
                          aria-label={`Select ${c.name}`}
                        />
                      </td>
                      <td className="fw-semibold text-primary">{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.email}</td>
                      <td>{c.gender}</td>
                      <td>{c.relationship || c.id || '—'}</td>
                      <td>{c.address}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEdit(c._id, c.name, c.phone, c.email, c.gender, c.id, c.address, c.relationship)}
                          aria-label={`Edit ${c.name}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(c._id, c.name)}
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  )))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-wrapper">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >◀</button>
            {[...Array(pageCount)].map((_, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={currentPage === pageCount}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
            >▶</button>
          </div>
        </motion.div>

        {/* ══════════════════════ NOTIFICATION SECTIONS ══════════════════════ */}

        {/* Row: Dispatch List + Escalation */}
        <div className="contacts-notif-grid">

          {/* Contact Dispatch List — uses real contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="contacts-notif-card"
          >
            <div className="contacts-notif-header">
              <Users size={18} />
              <h2>Emergency Contact List</h2>
            </div>
            <div className="contacts-dispatch-list">
              {contacts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '1rem 0' }}>
                  No contacts added yet. Add contacts above to see them here.
                </p>
              ) : (
                contacts.slice(0, 4).map((c) => {
                  const hasEmail = !!c.email;
                  const hasPhone = !!c.phone;
                  const method = hasEmail && hasPhone ? 'Email + SMS'
                    : hasEmail ? 'Email only'
                      : hasPhone ? 'SMS only' : 'No channel';
                  const statusColor = hasEmail && hasPhone ? '#22c55e'
                    : hasEmail || hasPhone ? '#f59e0b' : '#ef4444';
                  const status = hasEmail && hasPhone ? 'All channels'
                    : hasEmail || hasPhone ? 'Partial' : 'No contact info';
                  return (
                    <div key={c._id} className="contacts-dispatch-item">
                      <div className="contacts-dispatch-avatar">{c.name.charAt(0).toUpperCase()}</div>
                      <div className="contacts-dispatch-info">
                        <p className="contacts-dispatch-name">{c.name}</p>
                        <p className="contacts-dispatch-meta">{c.relationship || 'Contact'} · {method}</p>
                      </div>
                      <span className="contacts-dispatch-status" style={{ color: statusColor, borderColor: statusColor + '44', background: statusColor + '18' }}>
                        {status}
                      </span>
                    </div>
                  );
                })
              )}
              {contacts.length > 4 && (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  +{contacts.length - 4} more contacts
                </p>
              )}
            </div>
          </motion.div>

          {/* Auto Escalation — planned feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="contacts-notif-card"
          >
            <div className="contacts-notif-header">
              <Clock3 size={18} />
              <h2>Auto Escalation</h2>
              <span style={{
                marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700,
                background: '#8b5cf620', color: '#8b5cf6', padding: '2px 10px',
                borderRadius: '999px', border: '1px solid #8b5cf640',
              }}>Planned</span>
            </div>
            <div className="contacts-escalation-list">
              {escalationLevels.map((level, idx) => (
                <div key={level.title} className="contacts-escalation-item">
                  <div className="contacts-escalation-badge">{idx + 1}</div>
                  <div>
                    <p className="contacts-escalation-threshold">{level.threshold}</p>
                    <h3 className="contacts-escalation-title">{level.title}</h3>
                    <p className="contacts-escalation-desc">{level.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reliability Notes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="contacts-notif-card contacts-reliability-card"
        >
          <div className="contacts-notif-header">
            <ShieldAlert size={18} />
            <h2>Notification Reliability Notes</h2>
          </div>
          <div className="contacts-reliability-body">
            <div className="contacts-reliability-badge">
              <Wifi size={14} /> Multi-channel redundancy active
            </div>
            <p>
              SafeHer follows multi-channel redundancy for critical events. If push delivery fails, the
              workflow retries with SMS and call-based fallback while preserving acknowledgement trace history.
            </p>
          </div>
        </motion.div>

      </div>
    </>
  );
}
