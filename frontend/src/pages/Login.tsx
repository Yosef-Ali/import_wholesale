import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/* ── Dot-grid SVG texture for dark panel ── */
function DotGrid() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

const METRICS = [
  { value: '340+', label: 'Shipments tracked' },
  { value: 'ETB 4.2M', label: 'Inventory value' },
  { value: '12', label: 'Active containers' },
];

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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-body)' }}>

      {/* ── LEFT PANEL — dark editorial ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '54%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          padding: '3.5rem',
          background: '#09090B',
        }}
      >
        {/* Dot grid texture */}
        <DotGrid />

        {/* Orange glow blob */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgb(232 82 26 / 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgb(232 82 26 / 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div className="relative z-10 anim-fade-up" style={{ animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2rem', height: '2rem',
              background: 'var(--accent)',
              borderRadius: '0.375rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '0.75rem',
              color: '#fff',
              flexShrink: 0,
            }}>BS</div>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#FAFAFA',
              letterSpacing: '-0.01em',
            }}>BuildSupply <span style={{ color: 'var(--accent)' }}>Pro</span></span>
          </div>
          <div style={{
            marginTop: '0.4rem',
            marginLeft: '2.625rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: '#3F3F46',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Import &amp; Wholesale · Addis Ababa
          </div>
        </div>

        {/* Hero headline */}
        <div className="relative z-10 anim-fade-up" style={{ animationDelay: '0.18s' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontVariationSettings: '"opsz" 72, "wght" 700',
            fontSize: 'clamp(2.8rem, 4.5vw, 4.2rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#FAFAFA',
            margin: '0 0 1.75rem 0',
          }}>
            Operations<br />
            <span style={{ color: 'var(--accent)' }}>built for</span><br />
            import.
          </h1>

          {/* Stat strip */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            {METRICS.map((m, i) => (
              <div
                key={m.label}
                className="anim-fade-up"
                style={{ animationDelay: `${0.28 + i * 0.09}s` }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.35rem',
                  fontWeight: 500,
                  color: '#FAFAFA',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>{m.value}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: '#52525B',
                  marginTop: '0.2rem',
                  letterSpacing: '0.02em',
                }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="relative z-10 anim-fade-in" style={{ animationDelay: '0.65s' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            border: '1px solid #27272A',
            borderRadius: '100px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: '#52525B',
            letterSpacing: '0.06em',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
            SYSTEM OPERATIONAL
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        background: 'var(--bg)',
      }}>
        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '1.75rem', height: '1.75rem',
              background: 'var(--accent)', borderRadius: '0.3rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.7rem', color: '#fff',
            }}>BS</div>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
              BuildSupply Pro
            </span>
          </div>
        </div>

        <div className="w-full anim-scale-in" style={{ maxWidth: '360px', animationDelay: '0.1s' }}>

          {/* Form header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontVariationSettings: '"opsz" 36, "wght" 600',
              fontSize: '2rem',
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: '0 0 0.375rem',
              lineHeight: 1.15,
            }}>Welcome back.</h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--muted)',
              margin: 0,
            }}>Sign in to your operations dashboard</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="anim-fade-in"
              style={{
                marginBottom: '1.25rem',
                padding: '0.7rem 0.875rem',
                background: 'rgb(232 82 26 / 0.06)',
                border: '1px solid rgb(232 82 26 / 0.2)',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--accent-dim)',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '0.4rem',
              }}>Username</label>
              <input
                type="text"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                placeholder="Administrator"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.875rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  border: '1.5px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '0.4rem',
              }}>Password</label>
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.875rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  border: '1.5px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.7rem',
                background: loading ? 'var(--accent-dim)' : 'var(--accent)',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.01em',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
                boxShadow: loading ? 'none' : '0 2px 12px rgb(232 82 26 / 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLElement).style.background = 'var(--accent-dim)';
                  (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 18px rgb(232 82 26 / 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  (e.target as HTMLElement).style.background = 'var(--accent)';
                  (e.target as HTMLElement).style.transform = 'translateY(0)';
                  (e.target as HTMLElement).style.boxShadow = '0 2px 12px rgb(232 82 26 / 0.3)';
                }
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: '#C4C0BB',
            letterSpacing: '0.04em',
          }}>
            Construction Materials · Import · Wholesale · Addis Ababa
          </p>
        </div>
      </div>
    </div>
  );
}
