import type { CSSProperties } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import SPMIGsPage from './pages/SPMIGsPage';
import MRCsPage from './pages/MRCsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectRollupPage from './pages/ProjectRollupPage';
import { useAnonymousAuth } from './auth/useAnonymousAuth';

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1rem'
};

function App() {
  const authState = useAnonymousAuth();

  if (!authState.ready) {
    return <div style={{ padding: '1rem' }}>Signing in...</div>;
  }

  if (authState.error) {
    return (
      <div style={{ padding: '1rem', color: 'red' }}>
        Auth error: {authState.error}
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>PMAV Material Planner</h1>
      <nav style={navStyle}>
        <Link to="/">SPMIGs</Link>
        <Link to="/mrcs">MRCs</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/rollup">Project Rollup</Link>
      </nav>
      <Routes>
        <Route path="/" element={<SPMIGsPage />} />
        <Route path="/mrcs" element={<MRCsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/rollup" element={<ProjectRollupPage />} />
      </Routes>
    </div>
  );
}

export default App;
