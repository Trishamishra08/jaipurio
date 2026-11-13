import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { mediaUrl } from '../../data/cloudinaryMedia';
import { isAdminAuthenticated, loginAdmin } from '../../utils/adminAuth';
import './admin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: localStorage.getItem('jaipurio_admin_remember') || '',
    password: '',
    remember: Boolean(localStorage.getItem('jaipurio_admin_remember')),
    totp: '',
  });
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await loginAdmin(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      if (result.requires2fa) setNeedsCode(true);
      return;
    }
    navigate(location.state?.from || '/admin', { replace: true });
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <Link to="/home" className="admin-login-logo">
          <img src={mediaUrl('/jaipurio_logo.png')} alt="Jaipurio" />
        </Link>

        <h1>Admin sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {error && <div className="admin-login-error">{error}</div>}

          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>

          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </label>

          {needsCode && (
            <label className="admin-field">
              <span>Authentication code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                autoFocus
                value={form.totp}
                onChange={(e) => setForm((p) => ({ ...p, totp: e.target.value.replace(/\D/g, '') }))}
                required
              />
            </label>
          )}

          <label className="admin-remember">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm((p) => ({ ...p, remember: e.target.checked }))}
            />
            Remember me?
          </label>

          <button type="submit" className="admin-btn-primary admin-login-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <footer className="admin-login-footer">
        © {new Date().getFullYear()} Jaipurio
      </footer>
    </div>
  );
};

export default AdminLogin;
