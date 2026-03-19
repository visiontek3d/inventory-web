import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo + heading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <img src="/logo.png" alt="VisionTek3D" style={{ width: 200, height: 200, objectFit: 'contain' }} />
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center', margin: 0 }}>
          Inventory Management
        </h1>
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
  // Isometric open-box diorama scene with building facade on back wall
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      {/* Floor */}
      <polygon points="6,52 36,62 66,52 36,42" fill="#0086A3" opacity="0.15" stroke="#0086A3" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Left wall */}
      <polygon points="6,28 6,52 36,62 36,38" fill="#0086A3" opacity="0.1" stroke="#0086A3" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Back wall (main facade) */}
      <polygon points="6,28 36,18 66,28 36,38" fill="#1a1a1a" stroke="#0086A3" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Building facade on back wall - sign strip */}
      <polygon points="12,29 36,21 60,29 36,37" fill="#0086A3" opacity="0.2" />
      {/* Sign banner */}
      <polygon points="18,27.5 36,22 54,27.5 36,33" fill="#0086A3" opacity="0.5" />
      {/* Windows row */}
      <polygon points="13,31 22,28 22,32 13,35" fill="#0086A3" opacity="0.6" />
      <polygon points="25,29.5 34,27 34,31 25,33.5" fill="#0086A3" opacity="0.6" />
      <polygon points="38,27 47,29.5 47,33.5 38,31" fill="#0086A3" opacity="0.6" />
      <polygon points="50,28 59,31 59,35 50,32" fill="#0086A3" opacity="0.6" />
      {/* Door */}
      <polygon points="33,31 39,29 39,37 33,39" fill="#0086A3" opacity="0.8" />
      {/* Parking lines on floor */}
      <line x1="24" y1="58" x2="30" y2="44" stroke="#0086A3" strokeWidth="0.8" opacity="0.5" />
      <line x1="36" y1="62" x2="36" y2="46" stroke="#0086A3" strokeWidth="0.8" opacity="0.5" />
      <line x1="48" y1="58" x2="42" y2="44" stroke="#0086A3" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function LiftIcon() {
  // Two lifts side by side: small 2-high (left) and taller 3-high (right)
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      {/* === 2-HIGH LIFT (left, smaller) === */}
      {/* Posts */}
      <rect x="8"  y="38" width="5" height="22" rx="1.5" fill="#0086A3" opacity="0.7" />
      <rect x="23" y="38" width="5" height="22" rx="1.5" fill="#0086A3" opacity="0.7" />
      {/* Cross beams (black arms) */}
      <rect x="6"  y="38" width="24" height="4" rx="1" fill="#444" stroke="#0086A3" strokeWidth="0.8" />
      <rect x="6"  y="48" width="24" height="3" rx="1" fill="#333" />
      {/* Base */}
      <rect x="6"  y="58" width="24" height="3" rx="1" fill="#222" stroke="#0086A3" strokeWidth="0.8" opacity="0.6" />

      {/* === 3-HIGH LIFT (right, taller) === */}
      {/* Posts */}
      <rect x="40" y="20" width="5" height="42" rx="1.5" fill="#0086A3" />
      <rect x="57" y="20" width="5" height="42" rx="1.5" fill="#0086A3" />
      {/* Top arm */}
      <rect x="38" y="22" width="26" height="4" rx="1" fill="#444" stroke="#0086A3" strokeWidth="0.8" />
      {/* Middle arm */}
      <rect x="38" y="37" width="26" height="4" rx="1" fill="#444" stroke="#0086A3" strokeWidth="0.8" />
      {/* Angled support tabs */}
      <rect x="40" y="26" width="8" height="3" rx="0.5" fill="#555" transform="rotate(-10 40 26)" />
      <rect x="54" y="26" width="8" height="3" rx="0.5" fill="#555" transform="rotate(10 62 26)" />
      <rect x="40" y="41" width="8" height="3" rx="0.5" fill="#555" transform="rotate(-10 40 41)" />
      <rect x="54" y="41" width="8" height="3" rx="0.5" fill="#555" transform="rotate(10 62 41)" />
      {/* Base */}
      <rect x="38" y="58" width="26" height="3" rx="1" fill="#222" stroke="#0086A3" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}
