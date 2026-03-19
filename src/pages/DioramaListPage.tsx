import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

type Tab = 'instock' | 'oneoff';

const isOneOff = (d: Diorama) => (d.one_off_lift_qty ?? 0) > 0 || (d.one_off_od_qty ?? 0) > 0;

const fetcher = async () => {
  const { data } = await supabase.from('dioramas').select('*').order('sku');
  return (data ?? []) as Diorama[];
};

export default function DioramaListPage() {
  const navigate = useNavigate();
  const { data: dioramas = [], isLoading } = useSWR<Diorama[]>('dioramas', fetcher, { revalidateOnFocus: false });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('instock');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dioramas.filter(d => {
      const matchesSearch = !q || d.sku.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      return matchesSearch && (tab === 'instock' ? !isOneOff(d) : isOneOff(d));
    });
  }, [dioramas, search, tab]);

  const inStockList = useMemo(() => dioramas.filter(d => !isOneOff(d)), [dioramas]);
  const oneOffList  = useMemo(() => dioramas.filter(d => isOneOff(d)), [dioramas]);

  const totalWalls      = inStockList.reduce((s, d) => s + (d.walls_qty ?? 0), 0);
  const totalDoor       = inStockList.reduce((s, d) => s + (d.open_door_qty ?? 0), 0);
  const totalLift       = inStockList.reduce((s, d) => s + (d.lift_qty ?? 0), 0);
  const totalOneOffLift = oneOffList.reduce((s, d) => s + (d.one_off_lift_qty ?? 0), 0);
  const totalOneOffOD   = oneOffList.reduce((s, d) => s + (d.one_off_od_qty ?? 0), 0);

  return (
    <Layout title="Dioramas">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU or description…"
          className="input"
        />

        {/* Tabs */}
        <div className="tab-bar">
          {(['instock', 'oneoff'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''}`}>
              {t === 'instock' ? 'In Stock' : 'One Off'}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '64px 0' }}>No dioramas found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(d => (
              <button
                key={d.sku}
                onClick={() => navigate(`/dioramas/${encodeURIComponent(d.sku)}`)}
                className="card card-interactive"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left',
                  borderLeft: d.carry_stock ? '3px solid #0086A3' : undefined,
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#111', border: '1px solid #222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.sku} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="#333" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f0f0f0', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.sku}</p>
                  <p style={{ color: '#555', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{d.description}</p>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {tab === 'instock' ? (
                    <>
                      <Badge label="W" value={d.walls_qty ?? 0} />
                      <Badge label="D" value={d.open_door_qty ?? 0} />
                      <Badge label="L" value={d.lift_qty ?? 0} />
                    </>
                  ) : (
                    <>
                      <Badge label="LV" value={d.one_off_lift_qty ?? 0} />
                      <Badge label="OD" value={d.one_off_od_qty ?? 0} />
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Totals */}
        {!isLoading && (
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, marginTop: 'auto' }}>
            <span style={{ color: '#444', fontWeight: 500 }}>Totals</span>
            <div style={{ width: 1, height: 16, background: '#222' }} />
            {tab === 'instock' ? (
              <div style={{ display: 'flex', gap: 20 }}>
                <Total label="Walls" value={totalWalls} />
                <Total label="Door" value={totalDoor} />
                <Total label="Lift" value={totalLift} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 20 }}>
                <Total label="Lift Ver." value={totalOneOffLift} />
                <Total label="Open Door" value={totalOneOffOD} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/dioramas/new')}
        style={{ position: 'fixed', bottom: 32, right: 32, width: 48, height: 48, background: '#0086A3', color: '#fff', border: '1px solid #00a0bf', borderRadius: '50%', fontSize: 24, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,134,163,0.4)', cursor: 'pointer', zIndex: 10, transition: 'all 0.15s' }}
        aria-label="Add diorama"
      >
        +
      </button>
    </Layout>
  );
}

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', minWidth: 36 }}>
      <span style={{ color: '#555', fontSize: 10, lineHeight: 1 }}>{label}</span>
      <span style={{ color: '#f0f0f0', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{value}</span>
    </span>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <span style={{ fontSize: 13 }}>
      <span style={{ color: '#444', marginRight: 4 }}>{label}:</span>
      <span style={{ color: '#fff', fontWeight: 600 }}>{value}</span>
    </span>
  );
}
