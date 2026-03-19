import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      {/* Header */}
      <header className="bg-black flex items-center px-4 py-2 gap-4 shrink-0">
        <img
          src="/logo.png"
          alt="VisionTek3D Logo"
          className="h-10 w-auto object-contain"
        />
        <span className="text-white font-bold text-lg flex-1">
          {title ?? 'Inventory Management'}
        </span>
        <span className="text-[#7A7A7A] text-sm hidden sm:block truncate max-w-[200px]">
          {userEmail}
        </span>
        <button
          onClick={handleSignOut}
          className="text-sm text-white bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1 hover:bg-[#2a2a2a] transition-colors shrink-0"
        >
          Sign Out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
