import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface CsvRow {
  sku: string;
  description: string;
  walls: number;
  open_door: number;
  lift: number;
}

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
    async function loadSettings() {
      const { data } = await supabase
        .from('user_settings')
        .select('value')
        .eq('key', 'desired_stock')
        .single();
      if (data) setDesiredStock(data.value ?? '');
    }
    loadSettings();
  }, []);

  async function handleSaveDesiredStock(e: FormEvent) {
    e.preventDefault();
    setSavingStock(true);
    setStockError(null);
    setDesiredStockSaved(false);

    const { error } = await supabase
      .from('user_settings')
      .upsert({ key: 'desired_stock', value: desiredStock }, { onConflict: 'key' });

    if (error) setStockError(error.message);
    else setDesiredStockSaved(true);
    setSavingStock(false);
  }

  function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split('\n').filter(l => l.trim());
    // Skip header row if it looks like a header
    const startIdx = lines[0]?.toLowerCase().includes('sku') ? 1 : 0;
    return lines.slice(startIdx).map((line, i) => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 5) throw new Error(`Row ${i + startIdx + 1}: expected 5 columns (SKU, Description, Walls, Open Door, Lift).`);
      const walls = parseInt(cols[2], 10);
      const open_door = parseInt(cols[3], 10);
      const lift = parseInt(cols[4], 10);
      if (isNaN(walls) || isNaN(open_door) || isNaN(lift)) {
        throw new Error(`Row ${i + startIdx + 1}: Walls, Open Door, and Lift must be numbers.`);
      }
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
      try {
        const rows = parseCsv(ev.target?.result as string);
        setCsvPreview(rows);
      } catch (err: unknown) {
        setCsvError(err instanceof Error ? err.message : 'CSV parse error.');
      }
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
      qty_walls: r.walls,
      qty_open_door: r.open_door,
      qty_lift: r.lift,
      carry_stock: false,
      is_one_off: false,
      one_off_qty: 0,
      photo_url: null,
    }));

    const { error, count } = await supabase
      .from('dioramas')
      .upsert(records, { onConflict: 'sku' })
      .select();

    if (error) {
      setCsvError(error.message);
    } else {
      setImportResult(`Successfully imported ${count ?? csvPreview.length} diorama(s).`);
      setCsvFileName(null);
      setCsvPreview([]);
    }
    setImporting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <Layout title="Settings">
      <div className="max-w-lg mx-auto w-full p-4 flex flex-col gap-6">

        {/* Desired Stock */}
        <section className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-3">
          <h2 className="text-white font-semibold">Desired Stock Level</h2>
          <form onSubmit={handleSaveDesiredStock} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[#7A7A7A] text-sm" htmlFor="desired-stock">
                Desired quantity per SKU
              </label>
              <input
                id="desired-stock"
                type="number"
                min={0}
                value={desiredStock}
                onChange={e => { setDesiredStock(e.target.value); setDesiredStockSaved(false); }}
                className="bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white text-sm
                           focus:outline-none focus:border-[#0086A3] transition-colors w-full"
                placeholder="e.g. 5"
              />
            </div>
            {stockError && (
              <p className="text-red-400 text-sm">{stockError}</p>
            )}
            {desiredStockSaved && (
              <p className="text-green-400 text-sm">Saved.</p>
            )}
            <button
              type="submit"
              disabled={savingStock}
              className="bg-[#0086A3] hover:bg-[#006f87] disabled:opacity-50 text-white
                         font-semibold rounded px-4 py-2 transition-colors text-sm self-start"
            >
              {savingStock ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>

        {/* Bulk CSV Import */}
        <section className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-3">
          <div>
            <h2 className="text-white font-semibold">Bulk Import Dioramas</h2>
            <p className="text-[#7A7A7A] text-xs mt-1">
              CSV format: <code className="text-[#0086A3]">SKU, Description, Walls, Open Door, Lift</code>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvChange}
              className="text-sm text-[#7A7A7A] file:mr-3 file:py-1.5 file:px-3 file:rounded
                         file:border-0 file:text-sm file:bg-[#0086A3] file:text-white
                         file:cursor-pointer hover:file:bg-[#006f87]"
            />
            {csvFileName && (
              <p className="text-[#7A7A7A] text-xs">Selected: {csvFileName}</p>
            )}
          </div>

          {csvError && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {csvError}
            </p>
          )}

          {importResult && (
            <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded px-3 py-2">
              {importResult}
            </p>
          )}

          {csvPreview.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[#7A7A7A] text-xs">{csvPreview.length} row(s) ready to import:</p>
              <div className="overflow-x-auto border border-[#333333] rounded">
                <table className="w-full text-xs">
                  <thead className="bg-[#111111]">
                    <tr className="text-[#7A7A7A]">
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-left px-3 py-2">Description</th>
                      <th className="text-right px-3 py-2">W</th>
                      <th className="text-right px-3 py-2">D</th>
                      <th className="text-right px-3 py-2">L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-[#252525]">
                        <td className="px-3 py-1.5 text-white font-mono">{row.sku}</td>
                        <td className="px-3 py-1.5 text-[#7A7A7A] max-w-[150px] truncate">{row.description}</td>
                        <td className="px-3 py-1.5 text-white text-right">{row.walls}</td>
                        <td className="px-3 py-1.5 text-white text-right">{row.open_door}</td>
                        <td className="px-3 py-1.5 text-white text-right">{row.lift}</td>
                      </tr>
                    ))}
                    {csvPreview.length > 10 && (
                      <tr className="border-t border-[#252525]">
                        <td colSpan={5} className="px-3 py-1.5 text-[#7A7A7A] text-center">
                          …and {csvPreview.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-[#0086A3] hover:bg-[#006f87] disabled:opacity-50 text-white
                           font-semibold rounded px-4 py-2 transition-colors text-sm self-start"
              >
                {importing ? 'Importing…' : `Import ${csvPreview.length} Row(s)`}
              </button>
            </div>
          )}
        </section>

        {/* Sign Out */}
        <section className="bg-[#1e1e1e] rounded-lg border border-[#333333] p-4 flex flex-col gap-3">
          <h2 className="text-white font-semibold">Account</h2>
          <button
            onClick={handleSignOut}
            className="bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-800
                       font-semibold rounded px-4 py-2 transition-colors text-sm self-start"
          >
            Sign Out
          </button>
        </section>
      </div>
    </Layout>
  );
}
