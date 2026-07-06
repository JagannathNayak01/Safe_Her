import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Toast from './components/common/Toast';
import TopLoader from './components/common/TopLoader';
import PrivateRoute from './components/common/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import ToastProvider from './context/ToastContext';
import TopLoaderProvider from './context/TopLoaderContext';
import PageShell from './components/common/PageShell';

// ── Lazy-loaded page components (code-splitting) ─────────────────────────────
const Home           = lazy(() => import('./components/pages/Home'));
const Login          = lazy(() => import('./components/pages/Login'));
const Register       = lazy(() => import('./components/pages/Register'));
const ForgotPassword = lazy(() => import('./components/pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./components/pages/ResetPassword'));
const Dashboard      = lazy(() => import('./components/pages/Dashboard'));
const Contacts       = lazy(() => import('./components/pages/Contacts'));
const SOSAlert       = lazy(() => import('./components/pages/SOSAlert'));
const About          = lazy(() => import('./components/pages/About'));
const History        = lazy(() => import('./components/pages/History'));
const Profile        = lazy(() => import('./components/pages/Profile'));
const NotFound       = lazy(() => import('./components/pages/NotFound'));

// ── Fallback spinner shown while a lazy chunk loads ──────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', width: '100%',
  }}>
    <div style={{
      width: 40, height: 40, border: '3.5px solid rgba(6,182,212,0.18)',
      borderTopColor: '#06b6d4', borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <TopLoaderProvider>
      <ToastProvider>
        <PageShell>
          <TopLoader />
          <Toast />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                       element={<Home />} />
            <Route path="/login"                  element={<Login />} />
            <Route path="/register"               element={<Register />} />
            <Route path="/forgot-password"        element={<ForgotPassword />} />
            <Route path="/reset-password/:token"  element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/contacts"  element={<PrivateRoute><Contacts  /></PrivateRoute>} />
            <Route path="/sos"       element={<PrivateRoute><SOSAlert  /></PrivateRoute>} />
            <Route path="/history"   element={<PrivateRoute><History   /></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><Profile   /></PrivateRoute>} />

            {/* Public */}
            <Route path="/about" element={<About />} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </PageShell>
      </ToastProvider>
      </TopLoaderProvider>
    </ErrorBoundary>
  );
}

export default App;
