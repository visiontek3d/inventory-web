import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

type Tab = 'instock' | 'oneoff' | 'restock';

const isOneOff = (d: Diorama) => (d.one_off_lift_qty ?? 0) > 0 || (d.one_off_od_qty ?? 0) > 0;

const fetcher = async () => {
  const { data } = await supabase.from('dioramas').select('*').order('sku');
  return (data ?? []) as Diorama[];
};

const settingsFetcher = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase.from('user_settings').select('desired_stock').eq('user_id', user.id).maybeSingle();
  return parseInt(data?.desired_stock ?? '0', 10) || 0;
};

export default function DioramaListPage() {
  const navigate = useNavigate();
  const { data: dioramas = [], isLoading } = useSWR<Diorama[]>('dioramas', fetcher, { revalidateOnFocus: false });
  const { data: desiredStock = 0 } = useSWR<number>('desired_stock', settingsFetcher, { revalidateOnFocus: false });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('instock');

  const halfTarget = Math.ceil(desiredStock / 2);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dioramas.filter(d => {
      const matchesSearch = !q || d.sku.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (tab === 'instock') return !isOneOff(d);
      if (tab === 'oneoff') return isOneOff(d);
      if (tab === 'restock') {
        if (!d.carry_stock || desiredStock === 0) return false;
        return d.walls_qty < desiredStock || d.open_door_qty < halfTarget || d.lift_qty < halfTarget;
      }
      return true;
    });
  }, [dioramas, search, tab, desiredStock, halfTarget]);

  const inStockList = useMemo(() => dioramas.filter(d => !isOneOff(d)), [dioramas]);
  const oneOffList  = useMemo(() => dioramas.filter(d => isOneOff(d)), [dioramas]);

  const totalWalls      = inStockList.reduce((s, d) => s + (d.walls_qty ?? 0), 0);
  const totalDoor       = inStockList.reduce((s, d) => s + (d.open_door_qty ?? 0), 0);
  const totalLift       = inStockList.reduce((s, d) => s + (d.lift_qty ?? 0), 0);
  const totalOneOffLift = oneOffList.reduce((s, d) => s + (d.one_off_lift_qty ?? 0), 0);
  const totalOneOffOD   = oneOffList.reduce((s, d) => s + (d.one_off_od_qty ?? 0), 0);

  const restockTotalW = filtered.reduce((s, d) => s + Math.max(0, desiredStock - d.walls_qty), 0);
  const restockTotalD = filtered.reduce((s, d) => s + Math.max(0, halfTarget - d.open_door_qty), 0);
  const restockTotalL = filtered.reduce((s, d) => s + Math.max(0, halfTarget - d.lift_qty), 0);

  return (
    <Layout title="Dioramas">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Top bar: back + add */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/dioramas/new')}
            style={{ background: '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0098b8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0086A3')}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Diorama
          </button>
        </div>

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
          {(['instock', 'oneoff', 'restock'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''}`}>
              {t === 'instock' ? 'All' : t === 'oneoff' ? 'One Off' : 'Restock'}
            </button>
          ))}
        </div>

        {/* Totals */}
        {!isLoading && (
          <div style={{ background: 'rgba(0,134,163,0.08)', border: '1px solid rgba(0,134,163,0.25)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', fontSize: 14 }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {tab === 'instock' ? (
                <>
                  <Total label="W" value={totalWalls} />
                  <Total label="D" value={totalDoor} />
                  <Total label="L" value={totalLift} />
                </>
              ) : tab === 'oneoff' ? (
                <>
                  <Total label="LV" value={totalOneOffLift} />
                  <Total label="OD" value={totalOneOffOD} />
                </>
              ) : (
                <>
                  <Total label="W" value={restockTotalW} restock />
                  <Total label="D" value={restockTotalD} restock />
                  <Total label="L" value={restockTotalL} restock />
                </>
              )}
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div className="spinner" />
          </div>
        ) : tab === 'restock' && desiredStock === 0 ? (
          <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '64px 0' }}>Set a Desired Stock in Settings to use this tab.</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '64px 0' }}>
            {tab === 'restock' ? 'All carry stock items are fully stocked.' : 'No dioramas found.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(d => {
              const wallsNeeded = Math.max(0, desiredStock - d.walls_qty);
              const doorNeeded  = Math.max(0, halfTarget - d.open_door_qty);
              const liftNeeded  = Math.max(0, halfTarget - d.lift_qty);

              return (
                <button
                  key={d.sku}
                  onClick={() => navigate(`/dioramas/${encodeURIComponent(d.sku)}`)}
                  className="card card-interactive"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left',
                    borderLeft: d.carry_stock && tab !== 'oneoff' ? '3px solid #0086A3' : undefined,
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
                    {tab === 'restock' && (
                      <p style={{ color: '#b45309', fontSize: 11, fontWeight: 600, marginTop: 3 }}>Needed to reach target</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {tab === 'oneoff' ? (
                      <>
                        <Badge label="LV" value={d.one_off_lift_qty ?? 0} />
                        <Badge label="OD" value={d.one_off_od_qty ?? 0} />
                      </>
                    ) : tab === 'restock' ? (
                      <>
                        <Badge label="W" value={wallsNeeded} restock={wallsNeeded > 0} />
                        <Badge label="D" value={doorNeeded} restock={doorNeeded > 0} />
                        <Badge label="L" value={liftNeeded} restock={liftNeeded > 0} />
                      </>
                    ) : (
                      <>
                        <Badge label="W" value={d.walls_qty ?? 0} />
                        <Badge label="D" value={d.open_door_qty ?? 0} />
                        <Badge label="L" value={d.lift_qty ?? 0} />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

    </Layout>
  );
}

function Badge({ label, value, restock = false }: { label: string; value: number; restock?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: restock ? '#fef3c7' : '#161616',
      border: `1px solid ${restock ? '#fcd34d' : '#2a2a2a'}`,
      borderRadius: 6, padding: '4px 8px', minWidth: 36,
    }}>
      <span style={{ color: restock ? '#b45309' : '#555', fontSize: 10, lineHeight: 1 }}>{label}</span>
      <span style={{ color: restock ? '#92400e' : '#f0f0f0', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{value}</span>
    </span>
  );
}

function Total({ label, value, restock = false }: { label: string; value: number; restock?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 36, padding: '4px 8px' }}>
      <span style={{ color: restock ? '#b45309' : '#0086A3', fontSize: 10, lineHeight: 1, opacity: 0.8 }}>{label}</span>
      <span style={{ color: restock ? '#92400e' : '#e0f4f8', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{value}</span>
    </span>
  );
}
