import { FormEvent, useEffect, useState } from 'react';
import {
  createProject,
  deleteProject,
  fetchMRCs,
  fetchProjects
} from '../services/firestoreService';
import { ProjectMRCApplication } from '../types';

function ProjectsPage() {
  const [projects, setProjects] = useState<
    { id: string; name: string; mrcApplications: ProjectMRCApplication[] }[]
  >([]);
  const [mrcApplications, setMrcApplications] = useState<ProjectMRCApplication[]>([
    { mrcId: '', occurrences: 1 }
  ]);
  const [mrcOptions, setMrcOptions] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, mrcData] = await Promise.all([fetchProjects(), fetchMRCs()]);
      setProjects(projData);
      setMrcOptions(mrcData);
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
    const cleaned = mrcApplications.filter((app) => app.mrcId && app.occurrences > 0);
    if (cleaned.length === 0) {
      setError('Add at least one MRC application');
      return;
    }
    setError(null);
    try {
      await createProject({ name, mrcApplications: cleaned });
      setName('');
      setMrcApplications([{ mrcId: '', occurrences: 1 }]);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const updateApplication = (
    idx: number,
    field: keyof ProjectMRCApplication,
    value: string
  ) => {
    setMrcApplications((prev) =>
      prev.map((app, i) =>
        i === idx
          ? {
              ...app,
              [field]: field === 'occurrences' ? Number(value) : value
            }
          : app
      )
    );
  };

  const addRow = () =>
    setMrcApplications((prev) => [...prev, { mrcId: '', occurrences: 1 }]);

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deleteProject(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 600 }}>
        <input
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <strong>MRC Applications</strong>
          {mrcApplications.map((app, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              <select
                value={app.mrcId}
                onChange={(e) => updateApplication(idx, 'mrcId', e.target.value)}
                required
              >
                <option value="">Select MRC</option>
                {mrcOptions.map((mrc) => (
                  <option key={mrc.id} value={mrc.id}>
                    {mrc.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Occurrences"
                value={app.occurrences}
                onChange={(e) => updateApplication(idx, 'occurrences', e.target.value)}
                required
              />
            </div>
          ))}
          <button type="button" onClick={addRow} style={{ marginTop: '0.5rem' }}>
            Add MRC
          </button>
        </div>
        <button type="submit" disabled={loading || !name}>
          Save Project
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          projects.map((project) => (
            <div key={project.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{project.name}</strong>
                <button onClick={() => onDelete(project.id)}>Delete</button>
              </div>
              <ul>
                {project.mrcApplications.map((app, idx) => {
                  const mrc = mrcOptions.find((m) => m.id === app.mrcId);
                  return (
                    <li key={idx}>
                      {mrc ? mrc.name : app.mrcId} — {app.occurrences} occurrences
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
