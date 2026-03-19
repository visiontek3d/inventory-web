import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Diorama } from '../types';

export default function DioramaAddEditPage() {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const isEditing = !!sku;
  const decodedSku = decodeURIComponent(sku ?? '');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formSku, setFormSku] = useState('');
  const [description, setDescription] = useState('');
  const [carryStock, setCarryStock] = useState(false);
  const [isOneOff, setIsOneOff] = useState(false);
  const [qtyWalls, setQtyWalls] = useState(0);
  const [qtyDoor, setQtyDoor] = useState(0);
  const [qtyLift, setQtyLift] = useState(0);
  const [oneOffQty, setOneOffQty] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    async function load() {
      const { data, error } = await supabase
        .from('dioramas')
        .select('*')
        .eq('sku', decodedSku)
        .single();
      if (error || !data) {
        setError('Failed to load diorama.');
        setLoading(false);
        return;
      }
      const d = data as Diorama;
      setFormSku(d.sku);
      setDescription(d.description);
      setCarryStock(d.carry_stock);
      setQtyWalls(d.walls_qty ?? 0);
      setQtyDoor(d.open_door_qty ?? 0);
      setQtyLift(d.lift_qty ?? 0);
      setOneOffQty(d.one_off_qty ?? 0);
      setExistingPhotoUrl(d.photo_url);
      setLoading(false);
    }
    load();
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
    const path = `${skuKey}.${ext}`;
    const { error } = await supabase.storage
      .from('diorama-photos')
      .upload(path, photoFile, { upsert: true });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const { data } = supabase.storage.from('diorama-photos').getPublicUrl(path);
    return data.publicUrl;
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

      const record = {
        sku: skuKey,
        description: description.trim(),
        carry_stock: carryStock,
        is_one_off: isOneOff,
        qty_walls: isOneOff ? 0 : qtyWalls,
        qty_open_door: isOneOff ? 0 : qtyDoor,
        qty_lift: isOneOff ? 0 : qtyLift,
        one_off_qty: isOneOff ? oneOffQty : 0,
        photo_url: photoUrl,
      };

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
    if (!isEditing) return;
    if (!window.confirm(`Delete diorama "${decodedSku}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from('dioramas').delete().eq('sku', decodedSku);
    if (error) {
      setError(error.message);
      setDeleting(false);
    } else {
      navigate('/dioramas');
    }
  }

  if (loading) {
    return (
      <Layout title={isEditing ? 'Edit Diorama' : 'Add Diorama'}>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#0086A3] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? `Edit: ${decodedSku}` : 'Add Diorama'}>
      <div className="max-w-lg mx-auto w-full p-4 flex flex-col gap-4">
        {/* Back */}
        <button
          onClick={() => navigate(isEditing ? `/dioramas/${encodeURIComponent(decodedSku)}` : '/dioramas')}
          className="text-[#7A7A7A] hover:text-white text-sm flex items-center gap-1 transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* SKU */}
          <Field label="SKU">
            <input
              type="text"
              required
              disabled={isEditing}
              value={formSku}
              onChange={e => setFormSku(e.target.value)}
              className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-[#0086A3] transition-colors w-full
                         disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g. DIO-001"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-[#0086A3] transition-colors w-full"
              placeholder="Enter description"
            />
          </Field>

          {/* Toggles */}
          <div className="flex gap-4 flex-wrap">
            <Toggle label="Carry Stock" checked={carryStock} onChange={setCarryStock} />
            <Toggle label="One Off" checked={isOneOff} onChange={setIsOneOff} />
          </div>

          {/* Photo */}
          <Field label="Photo">
            <div className="flex flex-col gap-2">
              {(photoPreview ?? existingPhotoUrl) && (
                <img
                  src={photoPreview ?? existingPhotoUrl ?? ''}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border border-[#333333]"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="text-sm text-[#7A7A7A] file:mr-3 file:py-1 file:px-3 file:rounded
                           file:border-0 file:text-sm file:bg-[#0086A3] file:text-white
                           file:cursor-pointer hover:file:bg-[#006f87]"
              />
            </div>
          </Field>

          {/* Quantities */}
          {!isOneOff ? (
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-3">
              <p className="text-[#7A7A7A] text-xs uppercase tracking-wider">
                {isEditing ? 'Current Quantities' : 'Initial Quantities'}
              </p>
              <NumberField label="Walls" value={qtyWalls} onChange={setQtyWalls} />
              <NumberField label="Open Door" value={qtyDoor} onChange={setQtyDoor} />
              <NumberField label="Lift" value={qtyLift} onChange={setQtyLift} />
            </div>
          ) : (
            <div className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-3">
              <p className="text-[#7A7A7A] text-xs uppercase tracking-wider">
                {isEditing ? 'Current Quantity' : 'Initial Quantity'}
              </p>
              <NumberField label="One Off Qty" value={oneOffQty} onChange={setOneOffQty} />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#0086A3] hover:bg-[#006f87] disabled:opacity-50 text-white
                         font-semibold rounded px-4 py-2 transition-colors"
            >
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Diorama'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-400
                           border border-red-800 font-semibold rounded px-4 py-2 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#7A7A7A] text-sm">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[#0086A3]' : 'bg-[#333333]'}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                      ${checked ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </div>
      <span className="text-white text-sm">{label}</span>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white text-sm w-24 shrink-0">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="w-20 bg-[#111111] border border-[#333333] rounded px-2 py-1 text-white text-sm
                   text-center focus:outline-none focus:border-[#0086A3] transition-colors"
      />
    </div>
  );
}

