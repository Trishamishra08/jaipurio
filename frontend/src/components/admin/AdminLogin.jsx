import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_DEMO, isAdminAuthenticated, loginAdmin } from '../../utils/adminAuth';
import './admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: localStorage.getItem('jaipurio_admin_remember') || '',
    password: '',
    remember: Boolean(localStorage.getItem('jaipurio_admin_remember')),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = loginAdmin(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(location.state?.from || '/admin', { replace: true });
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <Link to="/home" className="admin-login-logo">
          <img src="/jaipurio_logo.png" alt="Jaipurio" />
        </Link>

        <h1>Sign In Below</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <div className="admin-login-error">{error}</div>}

          <label className="admin-field">
            <span>Email/Username</span>
            <input
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>

          <label className="admin-field">
            <span className="flex items-center justify-between">
              Password
              <button
                type="button"
                className="admin-lost-password"
                onClick={() => window.alert('Use admin@gmail.com / admin for this demo.')}
              >
                Lost your password?
              </button>
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </label>

          <label className="admin-remember">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm((p) => ({ ...p, remember: e.target.checked }))}
            />
            Remember me?
          </label>

          <button type="submit" className="admin-btn-primary w-full justify-center h-11" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="admin-login-hint">
          Demo: {ADMIN_DEMO.email} / {ADMIN_DEMO.password}
        </p>
      </div>

      <footer className="admin-login-footer">
        Copyright {new Date().getFullYear()} © Jaipurio. Version 1.22.1
      </footer>
    </div>
  );
};

export default AdminLogin;
