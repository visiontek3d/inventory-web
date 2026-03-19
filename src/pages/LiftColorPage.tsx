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

const S = {
  input: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', padding: '9px 12px', fontSize: 14, width: '100%', outline: 'none', transition: 'border-color 0.15s' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
  card: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' } as React.CSSProperties,
};

export default function LiftColorPage() {
  const navigate = useNavigate();
  const [colors, setColors] = useState<LiftColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<null | 'new' | number>(null);
  const [form, setForm] = useState<ColorForm>(EMPTY_FORM);

  useEffect(() => { loadColors(); }, []);

  async function loadColors() {
    setLoading(true);
    const { data } = await supabase.from('lift_colors').select('*').order('sort_order');
    if (data) setColors(data as LiftColor[]);
    setLoading(false);
  }

  function openAdd() { setForm(EMPTY_FORM); setFormMode('new'); setError(null); }
  function openEdit(c: LiftColor) { setForm({ name: c.name, color_hex: c.color_hex, has_2high: c.has_2high, has_3high: c.has_3high }); setFormMode(c.id); setError(null); }
  function closeForm() { setFormMode(null); setError(null); }

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
          .insert({ name: form.name.trim(), color_hex: form.color_hex, has_2high: form.has_2high, has_3high: form.has_3high, sort_order: maxSort + 1 })
          .select().single();

        if (insertErr) throw insertErr;
        if (inserted) {
          const newColor = inserted as LiftColor;
          const liftRows: { size: string; variation: string; color: string; qty: number }[] = [];
          const variations = ['primary', 'extender'];
          if (form.has_2high) variations.forEach(v => liftRows.push({ size: '2high', variation: v, color: newColor.name, qty: 0 }));
          if (form.has_3high) variations.forEach(v => liftRows.push({ size: '3high', variation: v, color: newColor.name, qty: 0 }));
          if (liftRows.length > 0) {
            const { error: liftErr } = await supabase.from('lifts').insert(liftRows);
            if (liftErr) throw liftErr;
          }
        }
      } else if (typeof formMode === 'number') {
        const originalColor = colors.find(c => c.id === formMode);
        const { error: updateErr } = await supabase.from('lift_colors')
          .update({ name: form.name.trim(), color_hex: form.color_hex, has_2high: form.has_2high, has_3high: form.has_3high })
          .eq('id', formMode);
        if (updateErr) throw updateErr;

        if (originalColor) {
          const variations = ['primary', 'extender'];
          const toAdd: { size: string; variation: string; color: string; qty: number }[] = [];
          if (form.has_2high && !originalColor.has_2high) variations.forEach(v => toAdd.push({ size: '2high', variation: v, color: form.name.trim(), qty: 0 }));
          if (form.has_3high && !originalColor.has_3high) variations.forEach(v => toAdd.push({ size: '3high', variation: v, color: form.name.trim(), qty: 0 }));
          if (toAdd.length > 0) await supabase.from('lifts').insert(toAdd);
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
    await supabase.from('lifts').delete().eq('color', c.name);
    const { error } = await supabase.from('lift_colors').delete().eq('id', id);
    if (error) setError(error.message);
    else await loadColors();
    setDeletingId(null);
  }

  return (
    <Layout title="Lift Colors">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/lifts')}
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
            onClick={openAdd}
            style={{ background: '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0098b8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0086A3')}
          >
            + Add Color
          </button>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px' }}>
            {error}
          </p>
        )}

        {/* Inline form */}
        {formMode !== null && (
          <form onSubmit={handleSave} style={{ ...S.card, border: '1px solid #0086A3', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: '#f0f0f0', fontWeight: 600, fontSize: 14, margin: 0 }}>
              {formMode === 'new' ? 'Add Color' : 'Edit Color'}
            </p>

            {/* Name */}
            <div>
              <label style={S.label}>Name</label>
              <input style={S.input} type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Glacier Blue"
                onFocus={e => (e.target.style.borderColor = '#0086A3')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
            </div>

            {/* Color hex + pickers */}
            <div>
              <label style={S.label}>Color (hex)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, border: '1px solid #2a2a2a', background: form.color_hex.match(/^#[0-9a-fA-F]{6}$/) ? form.color_hex : '#333' }} />
                <input style={{ ...S.input, width: 'auto', flex: 1 }} type="text" value={form.color_hex} maxLength={7}
                  onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                  placeholder="#0086A3"
                  onFocus={e => (e.target.style.borderColor = '#0086A3')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
                <input type="color"
                  value={form.color_hex.match(/^#[0-9a-fA-F]{6}$/) ? form.color_hex : '#000000'}
                  onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #2a2a2a', background: '#161616', cursor: 'pointer', padding: 2, flexShrink: 0 }} />
              </div>
            </div>

            {/* Size checkboxes */}
            <div>
              <label style={S.label}>Available Sizes</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {([{ key: 'has_2high', label: '2-High' }, { key: 'has_3high', label: '3-High' }] as const).map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                    <div
                      onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                      style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${form[key] ? '#0086A3' : '#2a2a2a'}`, background: form[key] ? '#0086A3' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                    >
                      {form[key] && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ color: '#f0f0f0', fontSize: 14 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving}
                style={{ background: saving ? '#005f75' : '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={closeForm}
                style={{ background: 'transparent', color: '#7A7A7A', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7A7A'; e.currentTarget.style.borderColor = '#2a2a2a'; }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Color list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div className="spinner" />
          </div>
        ) : colors.length === 0 ? (
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '48px 0' }}>No colors yet. Add one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {colors.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                {/* Swatch */}
                <div style={{ width: 40, height: 40, borderRadius: 8, background: c.color_hex, flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />

                {/* Name + badges */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#f0f0f0', fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                  {c.has_2high && (
                    <span style={{ fontSize: 10, background: 'rgba(0,134,163,0.15)', color: '#0086A3', border: '1px solid rgba(0,134,163,0.35)', borderRadius: 20, padding: '2px 7px' }}>2H</span>
                  )}
                  {c.has_3high && (
                    <span style={{ fontSize: 10, background: 'rgba(147,51,234,0.12)', color: '#a78bfa', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 20, padding: '2px 7px' }}>3H</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openEdit(c)}
                    style={{ color: '#555', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0086A3')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                    style={{ color: 'rgba(248,113,113,0.7)', background: 'none', border: 'none', fontSize: 13, cursor: deletingId === c.id ? 'not-allowed' : 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'color 0.15s', opacity: deletingId === c.id ? 0.5 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.7)')}>
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
