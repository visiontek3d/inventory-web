import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

type Tab = 'instock' | 'oneoff';

export default function DioramaListPage() {
  const navigate = useNavigate();
  const [dioramas, setDioramas] = useState<Diorama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('instock');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('dioramas')
        .select('*')
        .order('sku');
      if (!error && data) setDioramas(data as Diorama[]);
      setLoading(false);
    }
    load();
  }, []);

  const isOneOff = (d: Diorama) => (d.one_off_lift_qty ?? 0) > 0 || (d.one_off_od_qty ?? 0) > 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dioramas.filter(d => {
      const matchesSearch = !q || d.sku.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
      const matchesTab = tab === 'instock' ? !isOneOff(d) : isOneOff(d);
      return matchesSearch && matchesTab;
    });
  }, [dioramas, search, tab]);

  const inStockList = useMemo(() => dioramas.filter(d => !isOneOff(d)), [dioramas]);
  const oneOffList = useMemo(() => dioramas.filter(d => isOneOff(d)), [dioramas]);

  const totalWalls = inStockList.reduce((s, d) => s + (d.walls_qty ?? 0), 0);
  const totalDoor = inStockList.reduce((s, d) => s + (d.open_door_qty ?? 0), 0);
  const totalLift = inStockList.reduce((s, d) => s + (d.lift_qty ?? 0), 0);
  const totalOneOffLift = oneOffList.reduce((s, d) => s + (d.one_off_lift_qty ?? 0), 0);
  const totalOneOffOD = oneOffList.reduce((s, d) => s + (d.one_off_od_qty ?? 0), 0);

  return (
    <Layout title="Dioramas">
      <div className="flex flex-col flex-1 p-4 gap-4 max-w-2xl mx-auto w-full">
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU or description…"
          className="bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-white text-sm
                     focus:outline-none focus:border-[#0086A3] transition-colors w-full"
        />

        {/* Tabs */}
        <div className="flex border-b border-[#333333]">
          {(['instock', 'oneoff'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === t
                  ? 'text-[#0086A3] border-[#0086A3]'
                  : 'text-[#7A7A7A] border-transparent hover:text-white'}`}
            >
              {t === 'instock' ? 'In Stock' : 'One Off'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[#7A7A7A] text-sm text-center py-12">No dioramas found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(d => (
              <button
                key={d.sku}
                onClick={() => navigate(`/dioramas/${encodeURIComponent(d.sku)}`)}
                className={`bg-[#1e1e1e] rounded-lg border border-[#333333] hover:border-[#0086A3]
                            transition-colors text-left flex items-center gap-3 p-3
                            ${d.carry_stock ? 'border-l-4 border-l-[#0086A3]' : ''}`}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-14 h-14 rounded bg-[#111111] overflow-hidden border border-[#333333] flex items-center justify-center">
                  {d.photo_url ? (
                    <img src={d.photo_url} alt={d.sku} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-[#333333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{d.sku}</p>
                  <p className="text-[#7A7A7A] text-xs truncate">{d.description}</p>
                </div>

                {/* Qty badges */}
                {tab === 'instock' ? (
                  <div className="flex gap-1 shrink-0">
                    <QtyBadge label="W" value={d.walls_qty ?? 0} />
                    <QtyBadge label="D" value={d.open_door_qty ?? 0} />
                    <QtyBadge label="L" value={d.lift_qty ?? 0} />
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <QtyBadge label="LV" value={d.one_off_lift_qty ?? 0} />
                    <QtyBadge label="OD" value={d.one_off_od_qty ?? 0} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Totals bar */}
        {!loading && (
          <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg px-4 py-3 flex items-center gap-4 text-sm mt-auto">
            <span className="text-[#7A7A7A]">Totals:</span>
            {tab === 'instock' ? (
              <>
                <TotalItem label="W" value={totalWalls} />
                <TotalItem label="D" value={totalDoor} />
                <TotalItem label="L" value={totalLift} />
              </>
            ) : (
              <>
                <TotalItem label="LV" value={totalOneOffLift} />
                <TotalItem label="OD" value={totalOneOffOD} />
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/dioramas/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0086A3] hover:bg-[#006f87] text-white
                   rounded-full shadow-lg flex items-center justify-center text-2xl font-bold
                   transition-colors z-10"
        aria-label="Add diorama"
      >
        +
      </button>
    </Layout>
  );
}

function QtyBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex flex-col items-center bg-[#111111] border border-[#333333] rounded px-2 py-1 min-w-[36px]">
      <span className="text-[#7A7A7A] text-[10px] leading-none">{label}</span>
      <span className="text-white font-semibold text-sm leading-tight">{value}</span>
    </span>
  );
}

function TotalItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-white">
      <span className="text-[#7A7A7A]">{label}: </span>
      {value}
    </span>
  );
}
