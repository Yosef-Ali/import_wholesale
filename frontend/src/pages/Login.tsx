import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const login    = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [usr,     setUsr    ] = useState('');
  const [pwd,     setPwd    ] = useState('');
  const [error,   setError  ] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usr, pwd);
      navigate('/');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      fontFamily: 'var(--font-sans)',
      padding: '1.5rem',
    }}>
      <div className="anim-scale-in" style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
          <div style={{
            width: '2.25rem', height: '2.25rem',
            background: 'var(--primary)',
            borderRadius: '0.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#fff',
            flexShrink: 0,
          }}>BS</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.2 }}>
              BuildSupply Pro
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Import &amp; Wholesale · Addis Ababa
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgb(0 0 0 / 0.07)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '1.25rem',
            color: 'var(--text)',
            margin: '0 0 0.375rem',
          }}>Sign in</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>
            Sign in to your operations dashboard
          </p>

          {error && (
            <div className="anim-fade-in" style={{
              marginBottom: '1rem',
              padding: '0.625rem 0.875rem',
              background: 'rgb(220 38 38 / 0.06)',
              border: '1px solid rgb(220 38 38 / 0.2)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: 'var(--status-red)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.375rem',
              }}>Username</label>
              <input
                type="text"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                placeholder="Administrator"
                required
                className="input"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '0.375rem',
              }}>Password</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.25rem',
                width: '100%',
                padding: '0.625rem',
                background: loading ? 'var(--primary-hover)' : 'var(--primary)',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          Construction Materials · Import · Wholesale
        </p>
      </div>
    </div>
  );
}
