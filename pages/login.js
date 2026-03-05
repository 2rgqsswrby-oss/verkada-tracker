import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const role = router.query.role || 'tracker';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isTracker = role === 'tracker';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, role }),
    });
    if (res.ok) {
      router.push(isTracker ? '/' : '/dashboard');
    } else {
      setError('Incorrect password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isTracker ? 'Tracker Login' : 'Project Dashboard Login'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: isTracker ? '#0d0d0f' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            <img src={isTracker ? 'https://cdn.verkada.com/image/upload/brand/verkada-logo-only-white.svg' : 'https://cdn.verkada.com/image/upload/v1671057149/brand/verkada-logo.svg'} alt="Verkada" style={{ height: 32 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: isTracker ? '#fff' : '#0d1b4b', fontFamily: 'Barlow, sans-serif' }}>
                {isTracker ? 'Deployment Tracker' : 'Camera Upgrade Project'}
              </div>
              <div style={{ fontSize: 12, color: isTracker ? '#555' : '#90a4ae', fontFamily: 'Barlow, sans-serif' }}>
                {isTracker ? 'Installer access' : 'Customer dashboard'}
              </div>
            </div>
          </div>

          {/* Card */}
          <div style={{ background: isTracker ? '#111116' : '#fff', borderRadius: 16, padding: 32, boxShadow: isTracker ? '0 4px 40px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)', border: isTracker ? '1px solid #1e1e24' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: isTracker ? '#fff' : '#37474f', marginBottom: 6, fontFamily: 'Barlow, sans-serif' }}>Enter Password</div>
            <div style={{ fontSize: 13, color: isTracker ? '#555' : '#90a4ae', marginBottom: 24, fontFamily: 'Barlow, sans-serif' }}>
              {isTracker ? 'Enter your installer password to access the tracker.' : 'Enter the password provided by your installation team.'}
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: isTracker ? '#1a1a1f' : '#f8f9fa',
                  border: error ? '1px solid #ff5252' : isTracker ? '1px solid #2a2a35' : '1px solid #e0e0e0',
                  color: isTracker ? '#e0e0e0' : '#37474f',
                  padding: '12px 16px', borderRadius: 8, fontSize: 15,
                  fontFamily: isTracker ? "'Share Tech Mono', monospace" : 'Barlow, sans-serif',
                  outline: 'none', marginBottom: error ? 8 : 20,
                }}
              />
              {error && <div style={{ fontSize: 12, color: '#ff5252', marginBottom: 16, fontFamily: 'Barlow, sans-serif' }}>{error}</div>}
              <button
                type="submit"
                disabled={loading || !password}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                  background: loading || !password ? (isTracker ? '#1e1e24' : '#e0e0e0') : isTracker ? '#00ff88' : '#0d1b4b',
                  color: loading || !password ? (isTracker ? '#555' : '#aaa') : isTracker ? '#000' : '#fff',
                  fontSize: 14, fontWeight: 700, cursor: loading || !password ? 'not-allowed' : 'pointer',
                  fontFamily: 'Barlow, sans-serif', letterSpacing: 0.5,
                  transition: 'all 0.15s',
                }}
              >
                {loading ? 'Checking...' : 'Sign In →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
