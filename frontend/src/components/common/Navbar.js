import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LogOut, ChevronDown } from 'lucide-react';

const BACKEND = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Navbar({ theme, setTheme, isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName,   setUserName]   = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const dropdownRef = useRef(null);

  /* ── Sync name + avatar from localStorage on login state change ── */
  useEffect(() => {
    setUserName(localStorage.getItem('userName')    || '');
    setUserAvatar(localStorage.getItem('userAvatar') || '');
  }, [isLoggedIn]);

  /* ── Listen for live avatar updates dispatched by Profile page ── */
  useEffect(() => {
    const handler = (e) => {
      const avatar = e.detail?.avatar || '';
      setUserAvatar(avatar);
    };
    window.addEventListener('safeher:avatar-updated', handler);
    return () => window.removeEventListener('safeher:avatar-updated', handler);
  }, []);

  /* ── Listen for live name updates dispatched by Profile page ── */
  useEffect(() => {
    const handler = (e) => {
      const newName = e.detail?.name || '';
      if (newName) setUserName(newName);
    };
    window.addEventListener('safeher:name-updated', handler);
    return () => window.removeEventListener('safeher:name-updated', handler);
  }, []);

  /* ── Close dropdown when clicking outside ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  /* ── Avatar src: data: and blob: used as-is; relative /uploads paths get BACKEND prefix ── */
  const initial   = userName ? userName.trim()[0].toUpperCase() : '?';
  const avatarSrc = userAvatar
    ? (userAvatar.startsWith('blob:') || userAvatar.startsWith('data:')
        ? userAvatar
        : `${BACKEND}${userAvatar}`)
    : null;

  return (
    <nav className="navbar">
      {/* Brand */}
      <h1 className="brand" onClick={() => navigate('/')}>
        <ShieldCheck size={24} className="brand-icon" />
        SafeHer
      </h1>

      {/* Nav links */}
      <div className="links">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Home
        </NavLink>

        {isLoggedIn && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/contacts" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Contacts
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              History
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              About
            </NavLink>

            {/* ── Avatar + Dropdown ── */}
            <div className="nav-avatar-wrap" ref={dropdownRef}>
              <button
                className="nav-avatar-btn"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" className="nav-avatar nav-avatar--img" />
                  : <span className="nav-avatar">{initial}</span>
                }
                <ChevronDown
                  size={14}
                  className="nav-avatar-chevron"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="nav-dropdown" role="menu">
                  {/* User info header */}
                  <div className="nav-dropdown-header">
                    {avatarSrc
                      ? <img src={avatarSrc} alt="avatar" className="nav-dropdown-avatar nav-dropdown-avatar--img" />
                      : <span className="nav-dropdown-avatar">{initial}</span>
                    }
                    <div className="nav-dropdown-info">
                      <p className="nav-dropdown-name">{userName || 'My Account'}</p>
                      <p className="nav-dropdown-sub">SafeHer User</p>
                    </div>
                  </div>

                  <div className="nav-dropdown-divider" />

                  {/* Profile */}
                  <button
                    className="nav-dropdown-item"
                    onClick={handleProfile}
                    role="menuitem"
                  >
                    <User size={15} />
                    Profile
                  </button>

                  {/* Logout */}
                  <button
                    className="nav-dropdown-item nav-dropdown-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!isLoggedIn && (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Login
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              About
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'active-link' : '')}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
