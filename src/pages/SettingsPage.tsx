import { useEffect, useState, type ChangeEvent } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface CsvRow {
  sku: string;
  description: string;
  walls: number;
  open_door: number;
  lift: number;
}

const S = {
  card: { background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 } as React.CSSProperties,
  input: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
  sectionTitle: { color: '#f0f0f0', fontSize: 15, fontWeight: 600, margin: 0 },
  btn: { background: '#0086A3', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' } as React.CSSProperties,
};

export default function SettingsPage() {
  const [desiredStock, setDesiredStock] = useState('');
  const [desiredStockSaved, setDesiredStockSaved] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('user_settings').select('value').eq('key', 'desired_stock').single()
      .then(({ data }) => { if (data) setDesiredStock(data.value ?? ''); });
  }, []);

  async function handleSaveDesiredStock(e: React.FormEvent) {
    e.preventDefault();
    setSavingStock(true);
    setStockError(null);
    setDesiredStockSaved(false);
    const { error } = await supabase.from('user_settings')
      .upsert({ key: 'desired_stock', value: desiredStock }, { onConflict: 'key' });
    if (error) setStockError(error.message);
    else setDesiredStockSaved(true);
    setSavingStock(false);
  }

  function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const startIdx = lines[0]?.toLowerCase().includes('sku') ? 1 : 0;
    return lines.slice(startIdx).map((line, i) => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 5) throw new Error(`Row ${i + startIdx + 1}: expected 5 columns (SKU, Description, Walls, Open Door, Lift).`);
      const walls = parseInt(cols[2], 10);
      const open_door = parseInt(cols[3], 10);
      const lift = parseInt(cols[4], 10);
      if (isNaN(walls) || isNaN(open_door) || isNaN(lift))
        throw new Error(`Row ${i + startIdx + 1}: Walls, Open Door, and Lift must be numbers.`);
      return { sku: cols[0], description: cols[1], walls, open_door, lift };
    });
  }

  function handleCsvChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCsvFileName(file?.name ?? null);
    setCsvError(null);
    setCsvPreview([]);
    setImportResult(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try { setCsvPreview(parseCsv(ev.target?.result as string)); }
      catch (err: unknown) { setCsvError(err instanceof Error ? err.message : 'CSV parse error.'); }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (csvPreview.length === 0) return;
    setImporting(true);
    setCsvError(null);
    setImportResult(null);
    const records = csvPreview.map(r => ({
      sku: r.sku,
      description: r.description,
      walls_qty: r.walls,
      open_door_qty: r.open_door,
      lift_qty: r.lift,
      carry_stock: false,
      one_off_qty: 0,
      one_off_lift_qty: 0,
      one_off_od_qty: 0,
      photo_url: null,
    }));
    const { error, count } = await supabase.from('dioramas').upsert(records, { onConflict: 'sku' }).select();
    if (error) setCsvError(error.message);
    else { setImportResult(`Successfully imported ${count ?? csvPreview.length} diorama(s).`); setCsvFileName(null); setCsvPreview([]); }
    setImporting(false);
  }

  return (
    <Layout title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Desired Stock */}
        <section style={S.card}>
          <p style={S.sectionTitle}>Desired Stock Level</p>
          <form onSubmit={handleSaveDesiredStock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={S.label} htmlFor="desired-stock">Desired quantity per SKU</label>
              <input id="desired-stock" type="number" min={0} value={desiredStock}
                onChange={e => { setDesiredStock(e.target.value); setDesiredStockSaved(false); }}
                style={S.input} placeholder="e.g. 5"
                onFocus={e => (e.target.style.borderColor = '#0086A3')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
            </div>
            {stockError && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{stockError}</p>}
            {desiredStockSaved && <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>Saved.</p>}
            <button type="submit" disabled={savingStock} style={{ ...S.btn, opacity: savingStock ? 0.6 : 1 }}>
              {savingStock ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>

        {/* Bulk CSV Import */}
        <section style={S.card}>
          <div>
            <p style={S.sectionTitle}>Bulk Import Dioramas</p>
            <p style={{ color: '#555', fontSize: 12, margin: '4px 0 0' }}>
              CSV format: <span style={{ color: '#0086A3', fontFamily: 'monospace' }}>SKU, Description, Walls, Open Door, Lift</span>
            </p>
          </div>

          <div>
            <input type="file" accept=".csv,text/csv" onChange={handleCsvChange}
              style={{ fontSize: 13, color: '#7A7A7A', width: '100%' }} />
            {csvFileName && <p style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Selected: {csvFileName}</p>}
          </div>

          {csvError && (
            <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {csvError}
            </p>
          )}
          {importResult && (
            <p style={{ color: '#4ade80', fontSize: 13, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {importResult}
            </p>
          )}

          {csvPreview.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: '#555', fontSize: 12, margin: 0 }}>{csvPreview.length} row(s) ready to import:</p>
              <div style={{ overflowX: 'auto', border: '1px solid #222', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      {['SKU', 'Description', 'W', 'D', 'L'].map((h, i) => (
                        <th key={h} style={{ color: '#555', fontWeight: 500, padding: '8px 12px', textAlign: i >= 2 ? 'right' : 'left', background: '#161616' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '7px 12px', color: '#f0f0f0', fontFamily: 'monospace' }}>{row.sku}</td>
                        <td style={{ padding: '7px 12px', color: '#7A7A7A', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                        <td style={{ padding: '7px 12px', color: '#f0f0f0', textAlign: 'right' }}>{row.walls}</td>
                        <td style={{ padding: '7px 12px', color: '#f0f0f0', textAlign: 'right' }}>{row.open_door}</td>
                        <td style={{ padding: '7px 12px', color: '#f0f0f0', textAlign: 'right' }}>{row.lift}</td>
                      </tr>
                    ))}
                    {csvPreview.length > 10 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '7px 12px', color: '#555', textAlign: 'center' }}>…and {csvPreview.length - 10} more rows</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={handleImport} disabled={importing} style={{ ...S.btn, opacity: importing ? 0.6 : 1 }}>
                {importing ? 'Importing…' : `Import ${csvPreview.length} Row(s)`}
              </button>
            </div>
          )}
        </section>

        {/* Account */}
        <section style={S.card}>
          <p style={S.sectionTitle}>Account</p>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
            Sign Out
          </button>
        </section>

      </div>
    </Layout>
  );
}
