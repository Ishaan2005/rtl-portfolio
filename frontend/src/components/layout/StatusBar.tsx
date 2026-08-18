import React from 'react';
import { RTLProject } from '../../types/rtl';

interface StatusBarProps {
  project: RTLProject;
  activeFileName?: string;
  isSimulating?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ project }) => {
  return (
    <footer className="app-statusbar" style={{ justifyContent: 'flex-end' }}>
      <div className="status-right" style={{ gap: '10px' }}>
        <div style={{ border: '1px solid var(--border-dim)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', fontSize: '11px', fontWeight: 800 }}>
          <span>Timescale: </span>
          <span style={{ color: 'var(--accent-amber)' }}>
            {project.simulation.timescale}
          </span>
        </div>

        <div style={{ border: '1px solid var(--border-dim)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', fontSize: '11px', fontWeight: 800 }}>
          <span>Standard: </span>
          <span style={{ color: 'var(--text-secondary)' }}>IEEE 1364-2001 / IEEE 1800</span>
        </div>

        <div style={{ border: '1px solid var(--border-dim)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', fontSize: '11px', fontWeight: 800 }}>
          <span style={{ color: 'var(--accent-emerald)' }}>Lint: 0 Warnings</span>
        </div>
      </div>
    </footer>
  );
};
