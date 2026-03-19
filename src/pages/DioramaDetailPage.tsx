import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama, Transaction } from '../types';

const S = {
  card: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 12, display: 'block' },
};

export default function DioramaDetailPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const [diorama, setDiorama] = useState<Diorama | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodedSku = decodeURIComponent(sku ?? '');
  const isOneOff = diorama
    ? (diorama.one_off_lift_qty ?? 0) > 0 || (diorama.one_off_od_qty ?? 0) > 0
    : false;

  useEffect(() => {
    if (!decodedSku) return;
    async function load() {
      setLoading(true);
      const [{ data: d }, { data: t }] = await Promise.all([
        supabase.from('dioramas').select('*').eq('sku', decodedSku).single(),
        supabase.from('transactions').select('*').eq('sku', decodedSku).order('created_at', { ascending: false }).limit(50),
      ]);
      if (d) setDiorama(d as Diorama);
      if (t) setTransactions(t as Transaction[]);
      setLoading(false);
    }
    load();
  }, [decodedSku]);

  async function refreshTransactions() {
    const { data: t } = await supabase.from('transactions').select('*').eq('sku', decodedSku).order('created_at', { ascending: false }).limit(50);
    if (t) setTransactions(t as Transaction[]);
  }

  async function adjustInStock(wallsDelta: number, doorDelta: number, liftDelta: number) {
    if (!diorama || adjusting) return;
    setAdjusting(true);
    setError(null);
    const { error } = await supabase.rpc('adjust_inventory', { p_sku: decodedSku, p_walls_delta: wallsDelta, p_open_door_delta: doorDelta, p_lift_delta: liftDelta });
    if (error) {
      setError(error.message);
    } else {
      setDiorama(prev => prev ? { ...prev, walls_qty: Math.max(0, prev.walls_qty + wallsDelta), open_door_qty: Math.max(0, prev.open_door_qty + doorDelta), lift_qty: Math.max(0, prev.lift_qty + liftDelta) } : prev);
      await refreshTransactions();
    }
    setAdjusting(false);
  }

  async function adjustOneOff(liftDelta: number, odDelta: number) {
    if (!diorama || adjusting) return;
    setAdjusting(true);
    setError(null);
    const { error } = await supabase.rpc('adjust_one_off_inventory', { p_sku: decodedSku, p_lift_delta: liftDelta, p_od_delta: odDelta });
    if (error) {
      setError(error.message);
    } else {
      setDiorama(prev => prev ? { ...prev, one_off_lift_qty: Math.max(0, prev.one_off_lift_qty + liftDelta), one_off_od_qty: Math.max(0, prev.one_off_od_qty + odDelta) } : prev);
      await refreshTransactions();
    }
    setAdjusting(false);
  }

  if (loading) return (
    <Layout title="Diorama">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner" /></div>
    </Layout>
  );

  if (!diorama) return (
    <Layout title="Diorama">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
        <p style={{ color: '#7A7A7A', fontSize: 14 }}>Diorama not found.</p>
        <button onClick={() => navigate('/dioramas')} style={{ color: '#0086A3', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Back to list</button>
      </div>
    </Layout>
  );

  return (
    <Layout title={diorama.sku}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top bar: back + edit */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dioramas')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate(`/dioramas/${encodeURIComponent(decodedSku)}/edit`)}
            style={{ background: 'transparent', color: '#f0f0f0', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0086A3'; e.currentTarget.style.color = '#0086A3'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#f0f0f0'; }}
          >
            Edit
          </button>
        </div>

        {/* Photo */}
        {diorama.photo_url && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #222', background: '#1a1a1a' }}>
            <img src={diorama.photo_url} alt={diorama.sku} style={{ width: '100%', objectFit: 'contain', maxHeight: 280, display: 'block' }} />
          </div>
        )}

        {/* Info card */}
        <div style={S.card}>
          <p style={{ color: '#f0f0f0', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>{diorama.sku}</p>
          <p style={{ color: '#7A7A7A', fontSize: 14, margin: '0 0 10px' }}>{diorama.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {diorama.carry_stock && (
              <span style={{ fontSize: 11, background: 'rgba(0,134,163,0.15)', color: '#0086A3', border: '1px solid rgba(0,134,163,0.35)', borderRadius: 20, padding: '3px 10px', fontWeight: 500 }}>
                Carry Stock
              </span>
            )}
            {isOneOff && (
              <span style={{ fontSize: 11, background: 'rgba(147,51,234,0.12)', color: '#a78bfa', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 20, padding: '3px 10px', fontWeight: 500 }}>
                One Off
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px' }}>
            {error}
          </p>
        )}

        {/* Quantity controls */}
        <div style={S.card}>
          <span style={S.label}>{isOneOff ? 'One Off Quantities' : 'Stock Quantities'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isOneOff ? (
              <>
                <QtyControl label="Lift Version" value={diorama.one_off_lift_qty ?? 0} disabled={adjusting} onDecrement={() => adjustOneOff(-1, 0)} onIncrement={() => adjustOneOff(1, 0)} />
                <QtyControl label="Open Door" value={diorama.one_off_od_qty ?? 0} disabled={adjusting} onDecrement={() => adjustOneOff(0, -1)} onIncrement={() => adjustOneOff(0, 1)} />
              </>
            ) : (
              <>
                <QtyControl label="Walls" value={diorama.walls_qty ?? 0} disabled={adjusting} onDecrement={() => adjustInStock(-1, 0, 0)} onIncrement={() => adjustInStock(1, 0, 0)} />
                <QtyControl label="Open Door" value={diorama.open_door_qty ?? 0} disabled={adjusting} onDecrement={() => adjustInStock(0, -1, 0)} onIncrement={() => adjustInStock(0, 1, 0)} />
                <QtyControl label="Lift" value={diorama.lift_qty ?? 0} disabled={adjusting} onDecrement={() => adjustInStock(0, 0, -1)} onIncrement={() => adjustInStock(0, 0, 1)} />
              </>
            )}
          </div>
        </div>

        {/* Transaction history */}
        <div style={S.card}>
          <span style={S.label}>Transaction History</span>
          {transactions.length === 0 ? (
            <p style={{ color: '#555', fontSize: 13 }}>No transactions yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222' }}>
                    {['Date', 'Type', 'Delta', 'User'].map((h, i) => (
                      <th key={h} style={{ color: '#555', fontWeight: 500, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0 0 10px', textAlign: i === 2 ? 'right' : 'left', paddingLeft: i === 3 ? 12 : 0 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                      <td style={{ padding: '8px 0', color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 0', color: '#f0f0f0' }}>{tx.component}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: tx.delta >= 0 ? '#4ade80' : '#f87171' }}>
                        {tx.delta >= 0 ? '+' : ''}{tx.delta}
                      </td>
                      <td style={{ padding: '8px 0', paddingLeft: 12, color: '#555', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.user_email ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

interface QtyControlProps {
  label: string;
  value: number;
  disabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

function QtyControl({ label, value, disabled, onDecrement, onIncrement }: QtyControlProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: '#aaa', fontSize: 14, width: 90, flexShrink: 0 }}>{label}</span>
      <button onClick={onDecrement} disabled={disabled || value <= 0} className="qty-btn">−</button>
      <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, width: 32, textAlign: 'center' }}>{value}</span>
      <button onClick={onIncrement} disabled={disabled} className="qty-btn">+</button>
    </div>
  );
}
