import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Lift, LiftColor } from '../types';

type SizeTab = '2high' | '3high';
type Variation = 'Primary Lift' | 'Extender';

interface LiftRow { lift: Lift; color: LiftColor; }

export default function LiftListPage() {
  const navigate = useNavigate();
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [colors, setColors] = useState<LiftColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SizeTab>('2high');
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('lifts').select('*'),
      supabase.from('lift_colors').select('*').order('sort_order'),
    ]).then(([{ data: l }, { data: c }]) => {
      if (l) setLifts(l as Lift[]);
      if (c) setColors(c as LiftColor[]);
      setLoading(false);
    });
  }, []);

  async function adjustQty(lift: Lift, delta: number) {
    if (adjusting !== null) return;
    setAdjusting(lift.id);
    setError(null);
    const { error } = await supabase.rpc('adjust_lift_inventory', { p_lift_id: lift.id, p_delta: delta });
    if (error) {
      setError(error.message);
    } else {
      setLifts(prev => prev.map(l => l.id === lift.id ? { ...l, qty: Math.max(0, l.qty + delta) } : l));
    }
    setAdjusting(null);
  }

  function getRows(size: SizeTab, variation: Variation): LiftRow[] {
    const sizeLabel = size === '2high' ? '2-High' : '3-High';
    return colors
      .filter(c => size === '2high' ? c.has_2high : c.has_3high)
      .flatMap(c => {
        const lift = lifts.find(l => l.size === sizeLabel && l.variation === variation && l.color === c.name);
        return lift ? [{ lift, color: c }] : [];
      });
  }

  const variations: Variation[] = ['Primary Lift', 'Extender'];

  return (
    <Layout title="Lifts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        {/* Top bar: back + gear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
          <button
            onClick={() => navigate('/lifts/colors')}
            title="Color Settings"
            style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0086A3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {(['2high', '3high'] as SizeTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''}`}>
              {t === '2high' ? '2-High' : '3-High'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {error && (
              <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px' }}>
                {error}
              </p>
            )}

            {variations.map(variation => {
              const rows = getRows(tab, variation);
              return (
                <div key={variation} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p className="section-label">{variation}</p>
                  {rows.length === 0 ? (
                    <p style={{ color: '#555', fontSize: 13, paddingLeft: 8 }}>No items.</p>
                  ) : (
                    rows.map(({ lift, color }) => (
                      <div key={lift.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                        {/* Color swatch */}
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: color.color_hex, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                        {/* Name */}
                        <span style={{ color: '#f0f0f0', fontSize: 14, flex: 1 }}>{color.name}</span>
                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <button
                            onClick={() => adjustQty(lift, -1)}
                            disabled={adjusting !== null || lift.qty <= 0}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, width: 32, textAlign: 'center' }}>
                            {lift.qty}
                          </span>
                          <button
                            onClick={() => adjustQty(lift, 1)}
                            disabled={adjusting !== null}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </Layout>
  );
}
