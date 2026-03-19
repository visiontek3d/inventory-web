import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { LiftColor } from '../types';

interface ColorForm {
  name: string;
  color_hex: string;
  has_2high: boolean;
  has_3high: boolean;
}

const EMPTY_FORM: ColorForm = { name: '', color_hex: '#0086A3', has_2high: true, has_3high: false };

export default function LiftColorPage() {
  const navigate = useNavigate();
  const [colors, setColors] = useState<LiftColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state: null = closed, number = editing id, 'new' = adding
  const [formMode, setFormMode] = useState<null | 'new' | number>(null);
  const [form, setForm] = useState<ColorForm>(EMPTY_FORM);

  useEffect(() => {
    loadColors();
  }, []);

  async function loadColors() {
    setLoading(true);
    const { data } = await supabase.from('lift_colors').select('*').order('sort_order');
    if (data) setColors(data as LiftColor[]);
    setLoading(false);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormMode('new');
    setError(null);
  }

  function openEdit(c: LiftColor) {
    setForm({ name: c.name, color_hex: c.color_hex, has_2high: c.has_2high, has_3high: c.has_3high });
    setFormMode(c.id);
    setError(null);
  }

  function closeForm() {
    setFormMode(null);
    setError(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (!form.color_hex.match(/^#[0-9a-fA-F]{6}$/)) { setError('Enter a valid hex color (e.g. #FF5500).'); return; }
    if (!form.has_2high && !form.has_3high) { setError('Select at least one of 2-High or 3-High.'); return; }

    setSaving(true);
    setError(null);

    try {
      if (formMode === 'new') {
        const maxSort = colors.length > 0 ? Math.max(...colors.map(c => c.sort_order)) : 0;
        const { data: inserted, error: insertErr } = await supabase
          .from('lift_colors')
          .insert({
            name: form.name.trim(),
            color_hex: form.color_hex,
            has_2high: form.has_2high,
            has_3high: form.has_3high,
            sort_order: maxSort + 1,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        if (inserted) {
          const newColor = inserted as LiftColor;
          // Insert lift rows for each enabled size and variation
          const liftRows: { size: string; variation: string; color: string; qty: number }[] = [];
          const sizes2high = ['2-High'];
          const sizes3high = ['3-High'];
          const variations = ['Primary Lift', 'Extender'];

          (form.has_2high ? sizes2high : []).forEach(size => {
            variations.forEach(variation => {
              liftRows.push({ size, variation, color: newColor.name, qty: 0 });
            });
          });
          (form.has_3high ? sizes3high : []).forEach(size => {
            variations.forEach(variation => {
              liftRows.push({ size, variation, color: newColor.name, qty: 0 });
            });
          });

          if (liftRows.length > 0) {
            const { error: liftErr } = await supabase.from('lifts').insert(liftRows);
            if (liftErr) throw liftErr;
          }
        }
      } else if (typeof formMode === 'number') {
        const originalColor = colors.find(c => c.id === formMode);

        const { error: updateErr } = await supabase
          .from('lift_colors')
          .update({
            name: form.name.trim(),
            color_hex: form.color_hex,
            has_2high: form.has_2high,
            has_3high: form.has_3high,
          })
          .eq('id', formMode);

        if (updateErr) throw updateErr;

        // Handle new size combinations added
        if (originalColor) {
          const variations = ['Primary Lift', 'Extender'];
          const toAdd: { size: string; variation: string; color: string; qty: number }[] = [];

          if (form.has_2high && !originalColor.has_2high) {
            variations.forEach(v => toAdd.push({ size: '2-High', variation: v, color: form.name.trim(), qty: 0 }));
          }
          if (form.has_3high && !originalColor.has_3high) {
            variations.forEach(v => toAdd.push({ size: '3-High', variation: v, color: form.name.trim(), qty: 0 }));
          }

          if (toAdd.length > 0) {
            await supabase.from('lifts').insert(toAdd);
          }

          // If name changed, update lift rows
          if (originalColor.name !== form.name.trim()) {
            await supabase.from('lifts').update({ color: form.name.trim() }).eq('color', originalColor.name);
          }
        }
      }

      await loadColors();
      closeForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const c = colors.find(x => x.id === id);
    if (!c) return;
    if (!window.confirm(`Delete color "${c.name}"? All associated lift records will also be deleted.`)) return;
    setDeletingId(id);
    // Delete lifts with this color name
    await supabase.from('lifts').delete().eq('color', c.name);
    const { error } = await supabase.from('lift_colors').delete().eq('id', id);
    if (error) setError(error.message);
    else await loadColors();
    setDeletingId(null);
  }

  return (
    <Layout title="Lift Colors">
      <div className="max-w-lg mx-auto w-full p-4 flex flex-col gap-4">
        {/* Back + Add */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/lifts')}
            className="text-[#7A7A7A] hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1" />
          <button
            onClick={openAdd}
            className="bg-[#0086A3] hover:bg-[#006f87] text-white text-sm font-semibold
                       rounded px-3 py-1.5 transition-colors"
          >
            + Add Color
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}

        {/* Inline form */}
        {formMode !== null && (
          <form
            onSubmit={handleSave}
            className="bg-[#1e1e1e] rounded-lg border border-[#0086A3] p-4 flex flex-col gap-4"
          >
            <p className="text-white font-semibold">{formMode === 'new' ? 'Add Color' : 'Edit Color'}</p>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[#7A7A7A] text-sm">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                           focus:outline-none focus:border-[#0086A3] transition-colors"
                placeholder="e.g. Glacier Blue"
              />
            </div>

            {/* Color hex + preview */}
            <div className="flex flex-col gap-1">
              <label className="text-[#7A7A7A] text-sm">Color (hex)</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded border border-[#333333] shrink-0"
                  style={{ backgroundColor: form.color_hex.match(/^#[0-9a-fA-F]{6}$/) ? form.color_hex : '#333333' }}
                />
                <input
                  type="text"
                  value={form.color_hex}
                  onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                  className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                             focus:outline-none focus:border-[#0086A3] transition-colors flex-1"
                  placeholder="#0086A3"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={form.color_hex.match(/^#[0-9a-fA-F]{6}$/) ? form.color_hex : '#000000'}
                  onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                  className="w-10 h-10 rounded border border-[#333333] bg-[#111111] cursor-pointer p-0.5"
                />
              </div>
            </div>

            {/* Size toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.has_2high}
                  onChange={e => setForm(f => ({ ...f, has_2high: e.target.checked }))}
                  className="accent-[#0086A3] w-4 h-4"
                />
                <span className="text-white text-sm">2-High</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.has_3high}
                  onChange={e => setForm(f => ({ ...f, has_3high: e.target.checked }))}
                  className="accent-[#0086A3] w-4 h-4"
                />
                <span className="text-white text-sm">3-High</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0086A3] hover:bg-[#006f87] disabled:opacity-50 text-white
                           font-semibold rounded px-4 py-2 transition-colors text-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="bg-[#111111] border border-[#333333] hover:border-[#7A7A7A] text-[#7A7A7A]
                           hover:text-white rounded px-4 py-2 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Color list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : colors.length === 0 ? (
          <p className="text-[#7A7A7A] text-sm text-center py-12">No colors yet. Add one above.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {colors.map(c => (
              <div
                key={c.id}
                className="bg-[#1e1e1e] rounded-lg border border-[#333333] px-4 py-3 flex items-center gap-3"
              >
                {/* Swatch */}
                <div
                  className="w-10 h-10 rounded shrink-0 border border-[#333333]"
                  style={{ backgroundColor: c.color_hex }}
                />
                {/* Name + badges */}
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  {c.has_2high && (
                    <span className="text-[10px] bg-[#0086A3]/20 text-[#0086A3] border border-[#0086A3]/40 px-1.5 py-0.5 rounded-full">
                      2H
                    </span>
                  )}
                  {c.has_3high && (
                    <span className="text-[10px] bg-purple-900/30 text-purple-400 border border-purple-700/40 px-1.5 py-0.5 rounded-full">
                      3H
                    </span>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-[#7A7A7A] hover:text-[#0086A3] text-sm transition-colors px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="text-red-500/70 hover:text-red-400 disabled:opacity-40 text-sm transition-colors px-2 py-1"
                  >
                    {deletingId === c.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
