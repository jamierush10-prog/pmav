import { FormEvent, useEffect, useState } from 'react';
import {
  createSPMIG,
  deleteSPMIG,
  fetchSPMIGs
} from '../services/firestoreService';
import { SPMIG } from '../types';

const emptyForm = {
  description: '',
  uom: '',
  unitCost: '',
  packSize: ''
};

function SPMIGsPage() {
  const [spmigs, setSpmigs] = useState<SPMIG[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSPMIGs();
      setSpmigs(data);
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
      await createSPMIG({
        description: form.description,
        uom: form.uom,
        unitCost: form.unitCost ? Number(form.unitCost) : undefined,
        packSize: form.packSize ? Number(form.packSize) : undefined
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deleteSPMIG(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2>SPMIG Master Data</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 400 }}>
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          placeholder="UOM"
          value={form.uom}
          onChange={(e) => setForm({ ...form, uom: e.target.value })}
          required
        />
        <input
          placeholder="Unit Cost"
          type="number"
          value={form.unitCost}
          onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
        />
        <input
          placeholder="Pack Size"
          type="number"
          value={form.packSize}
          onChange={(e) => setForm({ ...form, packSize: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          Add SPMIG
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>UOM</th>
                <th>Unit Cost</th>
                <th>Pack Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {spmigs.map((spmig) => (
                <tr key={spmig.id}>
                  <td>{spmig.description}</td>
                  <td>{spmig.uom}</td>
                  <td>{spmig.unitCost ?? '-'}</td>
                  <td>{spmig.packSize ?? '-'}</td>
                  <td>
                    <button onClick={() => onDelete(spmig.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SPMIGsPage;
