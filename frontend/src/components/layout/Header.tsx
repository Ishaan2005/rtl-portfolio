import React from 'react';
import { Cpu, Play, Loader2, Layers, AlertTriangle } from 'lucide-react';
import { RTLProject, SimulationStage } from '../../types/rtl';

interface HeaderProps {
  projects: RTLProject[];
  activeProject: RTLProject;
  onSelectProject: (projectId: string) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  simulationStage: SimulationStage;
  onOpenRecruiterModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onRunSimulation,
  isSimulating,
  simulationStage,
}) => {
  const getStageLabel = () => {
    switch (simulationStage) {
      case 'queued': return 'Queued...';
      case 'compiling': return 'Compiling (iverilog)...';
      case 'simulating': return 'Simulating (vvp)...';
      case 'parsing': return 'Parsing VCD...';
      case 'completed': return 'Simulation Done';
      case 'failed': return 'Run Failed';
      default: return 'Run Simulation';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-badge title-block">
          <div className="brand-icon">
            <Cpu size={18} />
          </div>
          <div style={{ fontSize: '15px' }}>
            <span style={{ color: '#0284c7', fontWeight: 900 }}>SILICON</span>
            <span style={{ color: '#000000', fontWeight: 900 }}>FORGE</span>
            <span style={{ fontSize: '11px', color: '#713f12', marginLeft: '6px', fontWeight: 800 }}>RTL PORTFOLIO</span>
          </div>
        </div>

        <div className="project-select-wrapper">
          <span className="project-select-label">DUT:</span>
          <select
            className="project-select"
            value={activeProject.id}
            onChange={(e) => onSelectProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.topModule})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-center">
        <div className="metric-chip">
          <Layers size={15} style={{ color: 'var(--accent-cyan)' }} />
          <span className="metric-label">LUTs:</span>
          <span className="metric-value">{activeProject.stats.lutCount}</span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">FFs:</span>
          <span className="metric-value">{activeProject.stats.ffCount}</span>
        </div>
      </div>

      <div className="header-right">
        <button
          className="btn btn-primary"
          onClick={onRunSimulation}
          disabled={isSimulating}
          title="Compile RTL with iverilog and run testbench vectors with vvp"
        >
          {isSimulating ? (
            <>
              <Loader2 size={15} className="spin-animation" />
              <span>{getStageLabel()}</span>
            </>
          ) : simulationStage === 'failed' ? (
            <>
              <AlertTriangle size={15} style={{ color: '#ef4444' }} />
              <span>Re-Run Sim</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
