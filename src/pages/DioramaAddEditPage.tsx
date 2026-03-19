import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

const S = {
  input: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', padding: '9px 12px', fontSize: 14, width: '100%', outline: 'none', transition: 'border-color 0.15s' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
  card: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' },
};

export default function DioramaAddEditPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const isEditing = !!sku;
  const decodedSku = decodeURIComponent(sku ?? '');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formSku, setFormSku] = useState('');
  const [description, setDescription] = useState('');
  const [carryStock, setCarryStock] = useState(false);
  const [qtyWalls, setQtyWalls] = useState(0);
  const [qtyDoor, setQtyDoor] = useState(0);
  const [qtyLift, setQtyLift] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    supabase.from('dioramas').select('*').eq('sku', decodedSku).single().then(({ data, error }) => {
      if (error || !data) { setError('Failed to load diorama.'); setLoading(false); return; }
      const d = data as Diorama;
      setFormSku(d.sku);
      setDescription(d.description);
      setCarryStock(d.carry_stock);
      setQtyWalls(d.walls_qty ?? 0);
      setQtyDoor(d.open_door_qty ?? 0);
      setQtyLift(d.lift_qty ?? 0);
      setExistingPhotoUrl(d.photo_url);
      setLoading(false);
    });
  }, [isEditing, decodedSku]);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  async function uploadPhoto(skuKey: string): Promise<string | null> {
    if (!photoFile) return existingPhotoUrl;
    const ext = photoFile.name.split('.').pop() ?? 'jpg';
    const { error } = await supabase.storage.from('diorama-photos').upload(`${skuKey}.${ext}`, photoFile, { upsert: true });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    return supabase.storage.from('diorama-photos').getPublicUrl(`${skuKey}.${ext}`).data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const skuKey = isEditing ? decodedSku : formSku.trim().toUpperCase();
      if (!skuKey) throw new Error('SKU is required.');
      if (!description.trim()) throw new Error('Description is required.');
      const photoUrl = await uploadPhoto(skuKey);
      const record = { sku: skuKey, description: description.trim(), carry_stock: carryStock, walls_qty: qtyWalls, open_door_qty: qtyDoor, lift_qty: qtyLift, photo_url: photoUrl };
      if (isEditing) {
        const { error } = await supabase.from('dioramas').update(record).eq('sku', decodedSku);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dioramas').insert(record);
        if (error) throw error;
      }
      navigate(`/dioramas/${encodeURIComponent(skuKey)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${decodedSku}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from('dioramas').delete().eq('sku', decodedSku);
    if (error) { setError(error.message); setDeleting(false); }
    else navigate('/dioramas');
  }

  if (loading) return (
    <Layout title={isEditing ? 'Edit Diorama' : 'Add Diorama'}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title={isEditing ? `Edit: ${decodedSku}` : 'Add Diorama'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Back */}
        <BackButton onClick={() => navigate(isEditing ? `/dioramas/${encodeURIComponent(decodedSku)}` : '/dioramas')} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* SKU + Description */}
          <div style={S.card}>
            <p className="section-label">Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>SKU</label>
                <input style={{ ...S.input, opacity: isEditing ? 0.5 : 1 }} type="text" required disabled={isEditing}
                  value={formSku} onChange={e => setFormSku(e.target.value)} placeholder="e.g. DIO-001"
                  onFocus={e => (e.target.style.borderColor = '#0086A3')} onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
              </div>
              <div>
                <label style={S.label}>Description</label>
                <input style={S.input} type="text" required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Enter description"
                  onFocus={e => (e.target.style.borderColor = '#0086A3')} onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <Toggle label="Carry Stock" checked={carryStock} onChange={setCarryStock} />
              </div>
            </div>
          </div>

          {/* Photo */}
          <div style={S.card}>
            <p className="section-label">Photo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(photoPreview ?? existingPhotoUrl) && (
                <img src={photoPreview ?? existingPhotoUrl ?? ''} alt="Preview"
                  style={{ width: 128, height: 128, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a2a2a' }} />
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange}
                style={{ fontSize: 13, color: '#7A7A7A' }}
                className="file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-[#0086A3] file:text-white file:cursor-pointer hover:file:bg-[#0098b8]" />
            </div>
          </div>

          {/* Quantities */}
          <div style={S.card}>
            <p className="section-label">{isEditing ? 'Quantities' : 'Initial Quantities'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <NumberField label="Walls" value={qtyWalls} onChange={setQtyWalls} />
              <NumberField label="Open Door" value={qtyDoor} onChange={setQtyDoor} />
              <NumberField label="Lift" value={qtyLift} onChange={setQtyLift} />
            </div>
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: saving ? '#005f75' : '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Diorama'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)}
        style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: checked ? '#0086A3' : '#2a2a2a', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
      <span style={{ color: '#f0f0f0', fontSize: 14 }}>{label}</span>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: '#aaa', fontSize: 14, width: 90, flexShrink: 0 }}>{label}</span>
      <input type="number" min={0} value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        style={{ width: 80, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', fontSize: 14, padding: '7px 10px', textAlign: 'center', outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = '#0086A3')}
        onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
    </div>
  );
}
