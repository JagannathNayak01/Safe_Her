import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  // We no longer keep the JWT in localStorage — it lives in an httpOnly cookie.
  // Use the non-sensitive flag set on login/register for client-side route guarding.
  // If the flag is stale (cookie expired), the first API call returns 401 which
  // clears the flag and redirects to /login via the Axios interceptor.
  const loggedIn = localStorage.getItem('safeher_logged_in');
  return loggedIn ? children : <Navigate to="/login" />;
}
