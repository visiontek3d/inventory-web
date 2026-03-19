import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Lift, LiftColor } from '../types';

type SizeTab = '2high' | '3high';
type Variation = 'Primary Lift' | 'Extender';

interface LiftRow {
  lift: Lift;
  color: LiftColor;
}

export default function LiftListPage() {
  const navigate = useNavigate();
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [colors, setColors] = useState<LiftColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SizeTab>('2high');
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from('lifts').select('*'),
        supabase.from('lift_colors').select('*').order('sort_order'),
      ]);
      if (l) setLifts(l as Lift[]);
      if (c) setColors(c as LiftColor[]);
      setLoading(false);
    }
    load();
  }, []);

  async function adjustQty(lift: Lift, delta: number) {
    if (adjusting !== null) return;
    setAdjusting(lift.id);
    setError(null);
    const { error } = await supabase.rpc('adjust_lift_inventory', {
      p_lift_id: lift.id,
      p_delta: delta,
    });
    if (error) {
      setError(error.message);
    } else {
      setLifts(prev => prev.map(l => l.id === lift.id ? { ...l, qty: l.qty + delta } : l));
    }
    setAdjusting(null);
  }

  function getRows(size: SizeTab, variation: Variation): LiftRow[] {
    const sizeLabel = size === '2high' ? '2-High' : '3-High';
    return colors
      .filter(c => size === '2high' ? c.has_2high : c.has_3high)
      .flatMap(c => {
        const lift = lifts.find(l => l.size === sizeLabel && l.variation === variation && l.color === c.name);
        if (!lift) return [];
        return [{ lift, color: c }];
      });
  }

  const variations: Variation[] = ['Primary Lift', 'Extender'];

  return (
    <Layout title="Lifts">
      <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
        {/* Header row with gear icon */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Lift Inventory</h2>
          <button
            onClick={() => navigate('/lifts/colors')}
            title="Color Settings"
            className="text-[#7A7A7A] hover:text-[#0086A3] transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#333333]">
          {(['2high', '3high'] as SizeTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === t
                  ? 'text-[#0086A3] border-[#0086A3]'
                  : 'text-[#7A7A7A] border-transparent hover:text-white'}`}
            >
              {t === '2high' ? '2-High' : '3-High'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
                {error}
              </p>
            )}

            {variations.map(variation => {
              const rows = getRows(tab, variation);
              return (
                <div key={variation} className="flex flex-col gap-2">
                  <p className="text-[#7A7A7A] text-xs uppercase tracking-wider">{variation}</p>
                  {rows.length === 0 ? (
                    <p className="text-[#7A7A7A] text-sm pl-2">No items.</p>
                  ) : (
                    rows.map(({ lift, color }) => (
                      <div
                        key={lift.id}
                        className="bg-[#1e1e1e] rounded-lg border border-[#333333] px-4 py-3
                                   flex items-center gap-3"
                      >
                        {/* Color swatch */}
                        <div
                          className="w-9 h-9 rounded shrink-0 border border-[#333333]"
                          style={{ backgroundColor: color.color_hex }}
                        />
                        {/* Name */}
                        <span className="text-white text-sm flex-1">{color.name}</span>
                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => adjustQty(lift, -1)}
                            disabled={adjusting !== null || lift.qty <= 0}
                            className="w-8 h-8 rounded bg-[#111111] border border-[#333333] text-white
                                       hover:bg-[#0086A3] hover:border-[#0086A3] disabled:opacity-40
                                       transition-colors font-bold"
                          >
                            −
                          </button>
                          <span className="text-white font-semibold w-8 text-center">{lift.qty}</span>
                          <button
                            onClick={() => adjustQty(lift, 1)}
                            disabled={adjusting !== null}
                            className="w-8 h-8 rounded bg-[#111111] border border-[#333333] text-white
                                       hover:bg-[#0086A3] hover:border-[#0086A3] disabled:opacity-40
                                       transition-colors font-bold"
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
