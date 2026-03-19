import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

type Tab = 'instock' | 'oneoff';

const isOneOff = (d: Diorama) => (d.one_off_lift_qty ?? 0) > 0 || (d.one_off_od_qty ?? 0) > 0;

export default function DioramaListPage() {
  const navigate = useNavigate();
  const [dioramas, setDioramas] = useState<Diorama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('instock');

  useEffect(() => {
    supabase.from('dioramas').select('*').order('sku').then(({ data }) => {
      if (data) setDioramas(data as Diorama[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dioramas.filter(d => {
      const matchesSearch = !q || d.sku.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      const matchesTab = tab === 'instock' ? !isOneOff(d) : isOneOff(d);
      return matchesSearch && matchesTab;
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
      <div className="flex flex-col gap-4 flex-1">
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
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-[#555] text-sm text-center py-16">No dioramas found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(d => (
              <button
                key={d.sku}
                onClick={() => navigate(`/dioramas/${encodeURIComponent(d.sku)}`)}
                className={`card card-interactive text-left flex items-center gap-3 p-3 w-full
                            ${d.carry_stock ? 'border-l-[3px] border-l-[#0086A3]' : ''}`}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-12 h-12 rounded-lg bg-[#111] overflow-hidden border border-[#222] flex items-center justify-center">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.sku} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{d.sku}</p>
                  <p className="text-[#555] text-xs truncate mt-0.5">{d.description}</p>
                </div>

                {/* Badges */}
                {tab === 'instock' ? (
                  <div className="flex gap-1.5 shrink-0">
                    <Badge label="W" value={d.walls_qty ?? 0} />
                    <Badge label="D" value={d.open_door_qty ?? 0} />
                    <Badge label="L" value={d.lift_qty ?? 0} />
                  </div>
                ) : (
                  <div className="flex gap-1.5 shrink-0">
                    <Badge label="LV" value={d.one_off_lift_qty ?? 0} />
                    <Badge label="OD" value={d.one_off_od_qty ?? 0} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Totals */}
        {!loading && (
          <div className="card px-4 py-3 flex items-center gap-4 text-sm mt-auto">
            <span className="text-[#444] font-medium">Totals</span>
            <div className="w-px h-4 bg-[#222]" />
            {tab === 'instock' ? (
              <div className="flex gap-4">
                <Total label="Walls" value={totalWalls} />
                <Total label="Door" value={totalDoor} />
                <Total label="Lift" value={totalLift} />
              </div>
            ) : (
              <div className="flex gap-4">
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
        className="fixed bottom-8 right-8 w-12 h-12 bg-[#0086A3] hover:bg-[#0098b8] text-white
                   rounded-full shadow-xl flex items-center justify-center text-2xl font-light
                   transition-all duration-150 z-10 border border-[#00a0bf]"
        aria-label="Add diorama"
      >
        +
      </button>
    </Layout>
  );
}

function Badge({ label, value }: { label: string; value: number }) {
  return (
    <span className="badge">
      <span className="badge-label">{label}</span>
      <span className="badge-value">{value}</span>
    </span>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-[#aaa] text-sm">
      <span className="text-[#444] mr-1">{label}:</span>
      <span className="text-white font-semibold">{value}</span>
    </span>
  );
}
