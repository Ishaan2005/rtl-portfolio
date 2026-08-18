import React from 'react';
import { Code, Terminal, Activity, GitFork } from 'lucide-react';

export type TabType = 'source' | 'simulation' | 'waveform' | 'diagram';

interface TabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeFileName: string;
  hasSimRun: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  activeFileName,
  hasSimRun,
}) => {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-item ${activeTab === 'source' ? 'active' : ''}`}
        onClick={() => onSelectTab('source')}
      >
        <Code size={14} style={{ color: activeTab === 'source' ? '#06b6d4' : 'inherit' }} />
        <span>Source ({activeFileName})</span>
      </button>

      <button
        className={`tab-item ${activeTab === 'simulation' ? 'active' : ''}`}
        onClick={() => onSelectTab('simulation')}
      >
        <Terminal size={14} style={{ color: activeTab === 'simulation' ? '#10b981' : 'inherit' }} />
        <span>Simulation Logs</span>
        {hasSimRun && <span className="tab-badge" style={{ color: '#10b981' }}>PASS</span>}
      </button>

      <button
        className={`tab-item ${activeTab === 'waveform' ? 'active' : ''}`}
        onClick={() => onSelectTab('waveform')}
      >
        <Activity size={14} style={{ color: activeTab === 'waveform' ? '#f59e0b' : 'inherit' }} />
        <span>Waveform Viewer</span>
        <span className="tab-badge">VCD</span>
      </button>

      <button
        className={`tab-item ${activeTab === 'diagram' ? 'active' : ''}`}
        onClick={() => onSelectTab('diagram')}
      >
        <GitFork size={14} style={{ color: activeTab === 'diagram' ? '#a855f7' : 'inherit' }} />
        <span>RTL Diagram</span>
        <span className="tab-badge">Schematic</span>
      </button>
    </nav>
  );
};
