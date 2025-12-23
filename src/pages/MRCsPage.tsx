import { FormEvent, useEffect, useState } from 'react';
import {
  createMRC,
  deleteMRC,
  fetchMRCs,
  fetchSPMIGs
} from '../services/firestoreService';
import { MRCItem, SPMIG } from '../types';

function MRCsPage() {
  const [mrcs, setMrcs] = useState<{ id: string; name: string; items: MRCItem[] }[]>([]);
  const [spmigs, setSpmigs] = useState<SPMIG[]>([]);
  const [name, setName] = useState('');
  const [items, setItems] = useState<MRCItem[]>([
    { spmigId: '', qtyPerOccur: 1, uom: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mrcData, spmigData] = await Promise.all([fetchMRCs(), fetchSPMIGs()]);
      setMrcs(mrcData);
      setSpmigs(spmigData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const cleanedItems = items.filter((i) => i.spmigId && i.qtyPerOccur > 0 && i.uom);
      if (cleanedItems.length === 0) {
        setError('Add at least one SPMIG line item');
        return;
      }
      await createMRC({ name, items: cleanedItems });
      setName('');
      setItems([{ spmigId: '', qtyPerOccur: 1, uom: '' }]);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateItem = (idx: number, field: keyof MRCItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: field === 'qtyPerOccur' ? Number(value) : value
            }
          : item
      )
    );
  };

  const addItemRow = () =>
    setItems((prev) => [...prev, { spmigId: '', qtyPerOccur: 1, uom: '' }]);

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deleteMRC(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2>MRCs</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 600 }}>
        <input
          placeholder="MRC Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <strong>Line Items</strong>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              <select
                value={item.spmigId}
                onChange={(e) => updateItem(idx, 'spmigId', e.target.value)}
                required
              >
                <option value="">Select SPMIG</option>
                {spmigs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description} ({s.id})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Qty/occur"
                value={item.qtyPerOccur}
                onChange={(e) => updateItem(idx, 'qtyPerOccur', e.target.value)}
                required
              />
              <input
                placeholder="UOM"
                value={item.uom}
                onChange={(e) => updateItem(idx, 'uom', e.target.value)}
                required
              />
            </div>
          ))}
          <button type="button" onClick={addItemRow} style={{ marginTop: '0.5rem' }}>
            Add Line
          </button>
        </div>
        <button type="submit" disabled={loading || !name}>
          Save MRC
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {mrcs.map((mrc) => (
              <div key={mrc.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{mrc.name}</strong>
                  <button onClick={() => onDelete(mrc.id)}>Delete</button>
                </div>
                <ul>
                  {mrc.items.map((item, idx) => {
                    const spmig = spmigs.find((s) => s.id === item.spmigId);
                    return (
                      <li key={idx}>
                        {spmig ? spmig.description : item.spmigId} — {item.qtyPerOccur} {item.uom}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MRCsPage;
