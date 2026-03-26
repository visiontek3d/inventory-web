import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

const S = {
  input: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
};

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#1a1a1a', border: '1px solid #222', borderRadius: 14, padding: '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        <img src="/logo.png" alt="VisionTek3D" style={{ width: 96, height: 96, objectFit: 'contain' }} />

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 700, margin: 0 }}>Inventory Management</h1>
          <p style={{ color: '#555', fontSize: 13, margin: '4px 0 0' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label} htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={S.input} placeholder="you@example.com" autoCapitalize="none"
              onFocus={e => (e.target.style.borderColor = '#0086A3')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          <div>
            <label style={S.label} htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={S.input} placeholder="••••••••"
              onFocus={e => (e.target.style.borderColor = '#0086A3')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: '#4ade80', fontSize: 13, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? '#005f75' : '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: 4 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0098b8'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0086A3'; }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
          <span style={{ color: '#555', fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', color: '#3c4043', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#4285F4', lineHeight: 1 }}>G</span>
          Continue with Google
        </button>

        <button
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
          style={{ color: '#0086A3', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
