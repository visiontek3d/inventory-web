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
        <NavCard onClick={() => navigate('/dioramas')} icon="/diorama-card.png" label="Dioramas" />
        <NavCard onClick={() => navigate('/lifts')} icon="/lift-card.png" label="Lifts" />
      </div>
    </div>
  );
}

function NavCard({ onClick, icon, label }: {
  onClick: () => void;
  icon: string;
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
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
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
      <img src={icon} alt={label} style={{ width: '50%', aspectRatio: '1', objectFit: 'contain', display: 'block', padding: '16px 0 0' }} />
      <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', padding: '14px 0' }}>{label}</span>
    </button>
  );
}

