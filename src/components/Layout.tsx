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
      <header className="bg-black border-b border-[#1f1f1f] shrink-0 w-full sticky top-0 z-20">
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="VisionTek3D" style={{ height: 36, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title ?? 'Inventory Management'}
          </span>
          <span style={{ color: '#444', fontSize: 12, display: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}
            className="sm:block">
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            style={{ fontSize: 12, color: '#888', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 12px', background: 'transparent', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; (e.target as HTMLElement).style.borderColor = '#0086A3'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#888'; (e.target as HTMLElement).style.borderColor = '#2a2a2a'; }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Centered content area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
