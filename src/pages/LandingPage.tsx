import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo + heading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <img src="/logo.png" alt="VisionTek3D" style={{ width: 160, height: 160, objectFit: 'contain' }} />
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center', margin: 0 }}>
          Inventory Management
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: 0 }}>VisionTek3D</p>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 560 }}>
        <NavCard onClick={() => navigate('/dioramas')} icon={<DioramaIcon />} label="Diorama" />
        <NavCard onClick={() => navigate('/lifts')} icon={<LiftIcon />} label="Lift" />
      </div>
    </div>
  );
}

function NavCard({ onClick, icon, label }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 220px',
        maxWidth: 260,
        background: '#1a1a1a',
        border: '1px solid #222',
        borderRadius: 14,
        padding: '36px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = '#0086A3';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 8px 24px rgba(0,134,163,0.2)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = '#222';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';
      }}
    >
      {icon}
      <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{label}</span>
    </button>
  );
}

function DioramaIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Backdrop/scene box */}
      <rect x="8" y="16" width="48" height="36" rx="3" stroke="#0086A3" strokeWidth="2" fill="none" />
      {/* Floor */}
      <line x1="8" y1="42" x2="56" y2="42" stroke="#0086A3" strokeWidth="1.5" />
      {/* Back wall */}
      <line x1="8" y1="16" x2="8" y2="52" stroke="#0086A3" strokeWidth="1.5" />
      {/* Perspective lines */}
      <line x1="8" y1="16" x2="20" y2="10" stroke="#0086A3" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="56" y1="16" x2="20" y2="10" stroke="#0086A3" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="20" y1="10" x2="20" y2="46" stroke="#0086A3" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Mini scene elements */}
      <rect x="28" y="30" width="10" height="12" rx="1" fill="#0086A3" opacity="0.6" />
      <rect x="42" y="34" width="7" height="8" rx="1" fill="#0086A3" opacity="0.4" />
      <rect x="16" y="36" width="6" height="6" rx="1" fill="#0086A3" opacity="0.4" />
    </svg>
  );
}

function LiftIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Car silhouette on platform */}
      <rect x="12" y="44" width="40" height="6" rx="2" fill="#0086A3" opacity="0.8" />
      {/* Platform post left */}
      <rect x="15" y="18" width="4" height="26" rx="1" fill="#0086A3" opacity="0.5" />
      {/* Platform post right */}
      <rect x="45" y="18" width="4" height="26" rx="1" fill="#0086A3" opacity="0.5" />
      {/* Upper lift arm */}
      <rect x="15" y="28" width="34" height="4" rx="2" fill="#0086A3" opacity="0.9" />
      {/* Lower lift arm */}
      <rect x="15" y="38" width="34" height="4" rx="2" fill="#0086A3" opacity="0.6" />
      {/* Up arrows */}
      <path d="M30 14 L32 10 L34 14" stroke="#0086A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M26 17 L32 11 L38 17" stroke="#0086A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5" />
    </svg>
  );
}
