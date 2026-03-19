import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama, Transaction } from '../types';

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
        supabase
          .from('transactions')
          .select('*')
          .eq('sku', decodedSku)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (d) setDiorama(d as Diorama);
      if (t) setTransactions(t as Transaction[]);
      setLoading(false);
    }
    load();
  }, [decodedSku]);

  async function refreshTransactions() {
    const { data: t } = await supabase
      .from('transactions')
      .select('*')
      .eq('sku', decodedSku)
      .order('created_at', { ascending: false })
      .limit(50);
    if (t) setTransactions(t as Transaction[]);
  }

  async function adjustInStock(wallsDelta: number, doorDelta: number, liftDelta: number) {
    if (!diorama || adjusting) return;
    setAdjusting(true);
    setError(null);
    const { error } = await supabase.rpc('adjust_inventory', {
      p_sku: decodedSku,
      p_walls_delta: wallsDelta,
      p_open_door_delta: doorDelta,
      p_lift_delta: liftDelta,
    });
    if (error) {
      setError(error.message);
    } else {
      setDiorama(prev => prev ? {
        ...prev,
        walls_qty: Math.max(0, prev.walls_qty + wallsDelta),
        open_door_qty: Math.max(0, prev.open_door_qty + doorDelta),
        lift_qty: Math.max(0, prev.lift_qty + liftDelta),
      } : prev);
      await refreshTransactions();
    }
    setAdjusting(false);
  }

  async function adjustOneOff(liftDelta: number, odDelta: number) {
    if (!diorama || adjusting) return;
    setAdjusting(true);
    setError(null);
    const { error } = await supabase.rpc('adjust_one_off_inventory', {
      p_sku: decodedSku,
      p_lift_delta: liftDelta,
      p_od_delta: odDelta,
    });
    if (error) {
      setError(error.message);
    } else {
      setDiorama(prev => prev ? {
        ...prev,
        one_off_lift_qty: Math.max(0, prev.one_off_lift_qty + liftDelta),
        one_off_od_qty: Math.max(0, prev.one_off_od_qty + odDelta),
      } : prev);
      await refreshTransactions();
    }
    setAdjusting(false);
  }

  if (loading) {
    return (
      <Layout title="Diorama Detail">
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!diorama) {
    return (
      <Layout title="Diorama Detail">
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-[#7A7A7A]">Diorama not found.</p>
          <button onClick={() => navigate('/dioramas')} className="text-[#0086A3] hover:underline text-sm">
            Back to list
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={diorama.sku}>
      <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
        {/* Back + Edit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dioramas')}
            className="text-[#7A7A7A] hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate(`/dioramas/${encodeURIComponent(decodedSku)}/edit`)}
            className="bg-[#1e1e1e] border border-[#333333] hover:border-[#0086A3] text-white
                       text-sm rounded px-3 py-1 transition-colors"
          >
            Edit
          </button>
        </div>

        {/* Photo */}
        {diorama.photo_url && (
          <div className="rounded-lg overflow-hidden border border-[#333333] bg-[#1e1e1e]">
            <img src={diorama.photo_url} alt={diorama.sku} className="w-full object-contain max-h-64" />
          </div>
        )}

        {/* Info card */}
        <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-1">
          <p className="text-white font-bold text-lg">{diorama.sku}</p>
          <p className="text-[#7A7A7A] text-sm">{diorama.description}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {diorama.carry_stock && (
              <span className="bg-[#0086A3]/20 text-[#0086A3] text-xs px-2 py-0.5 rounded-full border border-[#0086A3]/40">
                Carry Stock
              </span>
            )}
            {isOneOff && (
              <span className="bg-purple-900/30 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-700/40">
                One Off
              </span>
            )}
          </div>
        </div>

        {/* Quantity controls */}
        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}

        {isOneOff ? (
          <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4">
            <p className="text-[#7A7A7A] text-xs uppercase tracking-wider mb-3">One Off Quantities</p>
            <div className="flex flex-col gap-3">
              <QtyControl
                label="Lift Version"
                value={diorama.one_off_lift_qty ?? 0}
                disabled={adjusting}
                onDecrement={() => adjustOneOff(-1, 0)}
                onIncrement={() => adjustOneOff(1, 0)}
              />
              <QtyControl
                label="Open Door"
                value={diorama.one_off_od_qty ?? 0}
                disabled={adjusting}
                onDecrement={() => adjustOneOff(0, -1)}
                onIncrement={() => adjustOneOff(0, 1)}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4">
            <p className="text-[#7A7A7A] text-xs uppercase tracking-wider mb-3">Stock Quantities</p>
            <div className="flex flex-col gap-3">
              <QtyControl
                label="Walls"
                value={diorama.walls_qty ?? 0}
                disabled={adjusting}
                onDecrement={() => adjustInStock(-1, 0, 0)}
                onIncrement={() => adjustInStock(1, 0, 0)}
              />
              <QtyControl
                label="Open Door"
                value={diorama.open_door_qty ?? 0}
                disabled={adjusting}
                onDecrement={() => adjustInStock(0, -1, 0)}
                onIncrement={() => adjustInStock(0, 1, 0)}
              />
              <QtyControl
                label="Lift"
                value={diorama.lift_qty ?? 0}
                disabled={adjusting}
                onDecrement={() => adjustInStock(0, 0, -1)}
                onIncrement={() => adjustInStock(0, 0, 1)}
              />
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4">
          <p className="text-[#7A7A7A] text-xs uppercase tracking-wider mb-3">Transaction History</p>
          {transactions.length === 0 ? (
            <p className="text-[#7A7A7A] text-sm">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#7A7A7A] text-xs border-b border-[#333333]">
                    <th className="text-left pb-2 font-normal">Date</th>
                    <th className="text-left pb-2 font-normal">Type</th>
                    <th className="text-right pb-2 font-normal">Delta</th>
                    <th className="text-left pb-2 font-normal pl-3">User</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-[#252525]">
                      <td className="py-1.5 text-[#7A7A7A] text-xs whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-1.5 text-white">{tx.component}</td>
                      <td className={`py-1.5 text-right font-semibold ${tx.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.delta >= 0 ? '+' : ''}{tx.delta}
                      </td>
                      <td className="py-1.5 text-[#7A7A7A] text-xs pl-3 truncate max-w-[120px]">
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
    <div className="flex items-center gap-3">
      <span className="text-white text-sm w-28 shrink-0">{label}</span>
      <button
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        className="w-8 h-8 rounded bg-[#111111] border border-[#333333] text-white font-bold
                   hover:bg-[#0086A3] hover:border-[#0086A3] disabled:opacity-40 transition-colors"
      >
        −
      </button>
      <span className="text-white font-semibold text-lg w-10 text-center">{value}</span>
      <button
        onClick={onIncrement}
        disabled={disabled}
        className="w-8 h-8 rounded bg-[#111111] border border-[#333333] text-white font-bold
                   hover:bg-[#0086A3] hover:border-[#0086A3] disabled:opacity-40 transition-colors"
      >
        +
      </button>
    </div>
  );
}
