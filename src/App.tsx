import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import DioramaListPage from './pages/DioramaListPage';
import DioramaDetailPage from './pages/DioramaDetailPage';
import DioramaAddEditPage from './pages/DioramaAddEditPage';
import LiftListPage from './pages/LiftListPage';
import LiftColorPage from './pages/LiftColorPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <div className="w-10 h-10 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dioramas" element={<DioramaListPage />} />
        <Route path="/dioramas/new" element={<DioramaAddEditPage />} />
        <Route path="/dioramas/:sku/edit" element={<DioramaAddEditPage />} />
        <Route path="/dioramas/:sku" element={<DioramaDetailPage />} />
        <Route path="/lifts" element={<LiftListPage />} />
        <Route path="/lifts/colors" element={<LiftColorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
