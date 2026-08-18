import React, { useState } from 'react';
import {
  FileCode,
  CheckCircle2,
  FolderGit2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { RTLProject, RTLFile } from '../../types/rtl';

interface SidebarProps {
  project: RTLProject;
  activeFile: RTLFile;
  onSelectFile: (file: RTLFile) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ project, activeFile, onSelectFile }) => {
  const [showPorts, setShowPorts] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const sourceFiles = project.files.filter((f) => f.type === 'source');
  const tbFiles = project.files.filter((f) => f.type === 'testbench');

  return (
    <aside className="app-sidebar">
      {/* Project Title Block */}
      <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-title-block)', borderBottom: '1px solid var(--border-title-block)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderGit2 size={18} style={{ color: '#000000' }} />
          <span style={{ fontWeight: 900, fontSize: '15px', color: '#000000' }}>{project.title}</span>
        </div>
      </div>

      {/* RTL File Explorer Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowFiles(!showFiles)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showFiles ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ color: '#000000', fontWeight: 800 }}>Project Files ({project.files.length})</span>
          </div>
          <span style={{ fontSize: '11px', color: '#000000', fontWeight: 800 }}>Top: {project.topModule}</span>
        </div>

        {showFiles && (
          <ul className="sidebar-file-list">
            <li style={{ padding: '6px 10px 2px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              RTL Synthesis Units
            </li>
            {sourceFiles.map((file) => (
              <li
                key={file.id}
                className={`sidebar-file-item ${activeFile.id === file.id ? 'active' : ''}`}
                onClick={() => onSelectFile(file)}
              >
                <FileCode size={15} style={{ color: activeFile.id === file.id ? '#ffffff' : 'var(--text-secondary)' }} />
                <span>{file.name}</span>
                <span className="file-type-badge badge-source">RTL</span>
              </li>
            ))}

            {tbFiles.length > 0 && (
              <>
                <li style={{ padding: '8px 10px 2px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                  Verification Testbenches
                </li>
                {tbFiles.map((file) => (
                  <li
                    key={file.id}
                    className={`sidebar-file-item ${activeFile.id === file.id ? 'active' : ''}`}
                    onClick={() => onSelectFile(file)}
                  >
                    <CheckCircle2 size={15} style={{ color: activeFile.id === file.id ? '#ffffff' : 'var(--text-secondary)' }} />
                    <span>{file.name}</span>
                    <span className="file-type-badge badge-tb">TB</span>
                  </li>
                ))}
              </>
            )}
          </ul>
        )}
      </div>

      {/* Module Ports Inspector */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-header"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowPorts(!showPorts)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showPorts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ color: '#000000', fontWeight: 800 }}>I/O Interface ({project.ports.length} ports)</span>
          </div>
          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 800 }}>Verified</span>
        </div>

        {showPorts && (
          <div className="ports-inspector">
            {project.ports.map((port) => (
              <div key={port.name} className="port-item" title={port.description}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={port.direction === 'input' ? 'port-direction-in' : 'port-direction-out'}>
                    {port.direction === 'input' ? 'IN' : 'OUT'}
                  </span>
                  <span className="port-name">{port.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {port.width > 1 && (
                    <span className="port-meta">[{port.width - 1}:0]</span>
                  )}
                  {port.domain && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{port.domain}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini Help Section in Empty Space */}
      <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: 'none' }}>
        <div className="sidebar-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={15} style={{ color: '#000000' }} />
            <span style={{ color: '#000000', fontWeight: 800 }}>Quick Guide & Navigation</span>
          </div>
        </div>

        <div style={{ padding: '10px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-dim)', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ color: '#0284c7', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
              1. Project Files
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '18px', fontWeight: 600 }}>
              Click <strong>Project Files</strong> above to explore synthesizable Verilog modules and testbench stimulus.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-dim)', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ color: '#059669', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
              2. Simulation & Logs
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '18px', fontWeight: 600 }}>
              Click <strong>Run Simulation</strong> in the top header to compile with Icarus and inspect real VVP execution logs.
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-dim)', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ color: '#b45309', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>
              3. Waveforms & Netlist
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '18px', fontWeight: 600 }}>
              Switch to <strong>Waveform Viewer</strong> to place markers and analyze signal transitions, or <strong>RTL Diagram</strong> for Yosys schematics.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
