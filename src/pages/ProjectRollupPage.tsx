import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createOverride,
  deleteOverride,
  fetchMRCs,
  fetchOverrides,
  fetchProjects,
  fetchSPMIGs
} from '../services/firestoreService';
import { computeProjectRollup } from '../utils/computeProjectRollup';
import { MRC, Project, ProjectOverride, SPMIG } from '../types';

type OverrideForm = {
  mrcId: string;
  spmigId: string;
  actualQtyPerOccur: string;
  factor: string;
};

const emptyOverride: OverrideForm = {
  mrcId: '',
  spmigId: '',
  actualQtyPerOccur: '',
  factor: ''
};

function ProjectRollupPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [spmigs, setSpmigs] = useState<SPMIG[]>([]);
  const [mrcs, setMrcs] = useState<MRC[]>([]);
  const [overrides, setOverrides] = useState<ProjectOverride[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>(emptyOverride);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const loadBase = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectData, spmigData, mrcData] = await Promise.all([
        fetchProjects(),
        fetchSPMIGs(),
        fetchMRCs()
      ]);
      setProjects(projectData);
      setSpmigs(spmigData);
      setMrcs(mrcData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  const loadOverrides = async (projectId: string) => {
    try {
      const ovr = await fetchOverrides(projectId);
      setOverrides(ovr);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadOverrides(selectedProjectId);
    } else {
      setOverrides([]);
    }
  }, [selectedProjectId]);

  const rollup = useMemo(() => {
    if (!selectedProject) return [];
    return computeProjectRollup({
      project: selectedProject,
      mrcs,
      spmigs,
      overrides
    });
  }, [selectedProject, mrcs, spmigs, overrides]);

  const totalCost = useMemo(
    () => rollup.reduce((sum, row) => sum + (row.extCost ?? 0), 0),
    [rollup]
  );

  const onOverrideSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (overrideForm.actualQtyPerOccur && overrideForm.factor) {
      setError('Use either actual quantity or factor, not both.');
      return;
    }
    if (!overrideForm.actualQtyPerOccur && !overrideForm.factor) {
      setError('Provide an override value.');
      return;
    }
    setError(null);
    try {
      await createOverride({
        projectId: selectedProject.id,
        mrcId: overrideForm.mrcId,
        spmigId: overrideForm.spmigId,
        actualQtyPerOccur: overrideForm.actualQtyPerOccur
          ? Number(overrideForm.actualQtyPerOccur)
          : undefined,
        factor: overrideForm.factor ? Number(overrideForm.factor) : undefined
      });
      setOverrideForm(emptyOverride);
      await loadOverrides(selectedProject.id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDeleteOverride = async (id: string) => {
    setError(null);
    try {
      await deleteOverride(id);
      if (selectedProjectId) {
        await loadOverrides(selectedProjectId);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2>Project Rollup</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label>
          Project:{' '}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        {loading && <span>Loading...</span>}
      </div>

      {selectedProject && (
        <>
          <section style={{ marginTop: '1rem' }}>
            <h3>Material Rollup</h3>
            <table>
              <thead>
                <tr>
                  <th>SPMIG</th>
                  <th>Description</th>
                  <th>UOM</th>
                  <th>Total Needed</th>
                  <th>Order Qty</th>
                  <th>Unit Cost</th>
                  <th>Ext Cost</th>
                  <th>Contributions</th>
                </tr>
              </thead>
              <tbody>
                {rollup.map((row) => (
                  <tr key={row.spmigId}>
                    <td>{row.spmigId}</td>
                    <td>{row.description}</td>
                    <td>{row.uom}</td>
                    <td>{row.totalNeeded}</td>
                    <td>{row.orderQty}</td>
                    <td>{row.unitCost ?? '-'}</td>
                    <td>{row.extCost ?? '-'}</td>
                    <td>
                      <ul>
                        {row.contributions.map((contrib, idx) => (
                          <li key={idx}>
                            {contrib.mrcName} ({contrib.occurrences}x): base {contrib.qtyPerOccur} →
                            effective {contrib.effectiveQtyPerOccur} (total {contrib.totalFromMrc})
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Total Estimated Cost: </strong>
              {totalCost}
            </div>
          </section>

          <section style={{ marginTop: '1rem' }}>
            <h3>Overrides</h3>
            <form
              onSubmit={onOverrideSubmit}
              style={{ display: 'grid', gap: '0.5rem', maxWidth: 600 }}
            >
              <select
                value={overrideForm.mrcId}
                onChange={(e) => setOverrideForm({ ...overrideForm, mrcId: e.target.value })}
                required
              >
                <option value="">MRC</option>
                {mrcs.map((mrc) => (
                  <option key={mrc.id} value={mrc.id}>
                    {mrc.name}
                  </option>
                ))}
              </select>
              <select
                value={overrideForm.spmigId}
                onChange={(e) => setOverrideForm({ ...overrideForm, spmigId: e.target.value })}
                required
              >
                <option value="">SPMIG</option>
                {spmigs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.description} ({s.id})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Actual Qty / occur"
                value={overrideForm.actualQtyPerOccur}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, actualQtyPerOccur: e.target.value })
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder="Factor"
                value={overrideForm.factor}
                onChange={(e) => setOverrideForm({ ...overrideForm, factor: e.target.value })}
              />
              <button type="submit">Add Override</button>
            </form>

            <ul style={{ marginTop: '0.5rem' }}>
              {overrides.map((ovr) => {
                const mrc = mrcs.find((m) => m.id === ovr.mrcId);
                const spmig = spmigs.find((s) => s.id === ovr.spmigId);
                return (
                  <li key={ovr.id}>
                    {mrc ? mrc.name : ovr.mrcId} / {spmig ? spmig.description : ovr.spmigId}:{' '}
                    {typeof ovr.actualQtyPerOccur === 'number'
                      ? `Actual ${ovr.actualQtyPerOccur}`
                      : `Factor ${ovr.factor}`}
                    <button
                      onClick={() => onDeleteOverride(ovr.id)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

export default ProjectRollupPage;
