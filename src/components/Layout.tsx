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
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Full-width header */}
      <header className="bg-black border-b border-[#1f1f1f] shrink-0 w-full">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <img src="/logo.png" alt="VisionTek3D" className="h-9 w-auto object-contain shrink-0" />
          <span className="text-white font-bold text-base tracking-wide flex-1 truncate">
            {title ?? 'Inventory Management'}
          </span>
          <span className="text-[#555] text-xs hidden sm:block truncate max-w-[180px]">
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-[#aaa] hover:text-white border border-[#2a2a2a] hover:border-[#0086A3]
                       rounded px-3 py-1.5 transition-all duration-150 shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 flex flex-col flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
