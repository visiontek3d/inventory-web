import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1e1e] rounded-lg border border-[#333333] p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="VisionTek3D Logo"
          className="w-32 h-32 object-contain"
        />

        <div className="text-center">
          <h1 className="text-white text-2xl font-bold">Inventory Management</h1>
          <p className="text-[#7A7A7A] text-sm mt-1">VisionTek3D</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[#7A7A7A] text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-[#0086A3] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#7A7A7A] text-sm" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-[#0086A3] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          {message && (
            <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#0086A3] hover:bg-[#006f87] disabled:opacity-50 text-white font-semibold
                       rounded px-4 py-2 transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
          className="text-[#0086A3] text-sm hover:underline"
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
