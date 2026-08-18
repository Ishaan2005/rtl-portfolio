import React from 'react';
import { ShieldCheck, Activity, CheckCircle } from 'lucide-react';
import { RTLProject } from '../../types/rtl';

interface ProjectOverviewTabProps {
  project: RTLProject;
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  return (
    <div style={{ padding: '16px', overflowY: 'auto', height: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* Title Header Block */}
      <div style={{ backgroundColor: 'var(--bg-title-block)', border: '1px solid var(--border-title-block)', borderRadius: '8px', padding: '18px 22px', marginBottom: '20px', color: '#000000', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#854d0e', fontWeight: 800 }}>
            {project.category}
          </span>
          <span style={{ color: '#a16207', fontWeight: 800 }}>|</span>
          <span style={{ fontSize: '12px', color: '#713f12', fontWeight: 800 }}>Top Module: {project.topModule}</span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginBottom: '8px' }}>{project.title}</h1>
        <p style={{ fontSize: '13px', color: '#0f172a', lineHeight: '20px', fontWeight: 600 }}>{project.description}</p>
      </div>

      {/* Synthesis Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="sim-card">
          <div className="sim-card-title">Target Maximum Frequency</div>
          <div className="sim-card-value" style={{ color: 'var(--accent-emerald)', fontSize: '18px' }}>{project.stats.targetFmax}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>No setup/hold timing violations</div>
        </div>

        <div className="sim-card">
          <div className="sim-card-title">Cell Area / Utilization</div>
          <div className="sim-card-value" style={{ color: 'var(--accent-cyan)', fontSize: '18px' }}>{project.stats.lutCount} LUTs / {project.stats.ffCount} FFs</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{project.stats.bramCount} BRAM tile consumed</div>
        </div>

        <div className="sim-card">
          <div className="sim-card-title">Clock Domains</div>
          <div className="sim-card-value" style={{ color: 'var(--accent-purple)', fontSize: '16px' }}>
            {project.stats.clockDomains.join(', ')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Asynchronous CDC bounded</div>
        </div>

        <div className="sim-card">
          <div className="sim-card-title">Dynamic Power</div>
          <div className="sim-card-value" style={{ color: 'var(--accent-amber)', fontSize: '18px' }}>{project.stats.estPower}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Estimated on TSMC 28nm standard cell</div>
        </div>
      </div>

      {/* Architectural Highlights */}
      <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-mid)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-title-block)', borderBottom: '1px solid var(--border-title-block)', padding: '12px 18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#000000', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: '#15803d' }} />
            Architectural Implementation & Engineering Decisions
          </h2>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', paddingLeft: '2px' }}>
            {project.architectureDetails.map((detail, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: '19px' }}>
                <CheckCircle size={16} style={{ color: 'var(--accent-cyan)', marginTop: '2px', flexShrink: 0 }} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verification Strategy & SVA */}
      <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-mid)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'var(--bg-title-block)', borderBottom: '1px solid var(--border-title-block)', padding: '12px 18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#000000', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#0284c7' }} />
            Verification & SystemVerilog Assertions (SVA) Strategy
          </h2>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '20px', marginBottom: '14px', fontWeight: 600 }}>
            The verification environment employs a self-checking randomized testbench that stresses asynchronous handshake boundaries. Key covergroups encompass:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-sidebar)', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Pointer Gray Distance:</strong> <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Verifies that across all CDC crossings, Gray pointers transition by at most 1 bit per clock edge (0 Hamming hazard).</span>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-sidebar)', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Boundary Corner Stress:</strong> <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Verifies simultaneous back-to-back writes while reading from the exact boundary of empty and full watermarks.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
