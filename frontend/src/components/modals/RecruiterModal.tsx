import React from 'react';
import { X, Award, Cpu, FileCode2, Mail, Github } from 'lucide-react';

interface RecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecruiterModal: React.FC<RecruiterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Title Block */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', backgroundColor: 'var(--bg-title-block)', border: '1px solid var(--border-title-block)', borderRadius: '6px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#0284c7' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#000000' }}>RTL & Digital ASIC Engineer Profile</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#000000', cursor: 'pointer', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Core Value Prop */}
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', marginBottom: '14px', fontWeight: 600 }}>
          Welcome! This interactive portfolio demonstrates end-to-end digital ASIC design capabilities: from microarchitectural design, Clock Domain Crossing (CDC) analysis, and synthesizable SystemVerilog implementation, to cycle-accurate testbench verification, VCD waveform debugging, and gate-level netlist visualization.
        </p>

        {/* Skill Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} />
              <span>RTL & Microarchitecture</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: 'var(--text-primary)' }}>
              <li>AMBA APB3 Bus Protocol & Interconnect</li>
              <li>MAC Unit & OpenLane SkyWater 130nm</li>
              <li>IEEE 802.1D STP Switch Fabric FSM</li>
              <li>High-Frequency Pipelining & STA</li>
              <li>FSM Design & Microarchitectural Optimization</li>
            </ul>
          </div>

          <div style={{ backgroundColor: 'var(--bg-sidebar)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCode2 size={14} />
              <span>Verification & EDA Tools</span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: 'var(--text-primary)' }}>
              <li>Self-Checking & Randomized Verification</li>
              <li>Yosys Synthesis & Netlist Visualization</li>
              <li>Icarus Verilog, GTKWave & OpenLane Flow</li>
              <li>Vivado, Quartus & QuestaSim Simulation</li>
              <li>RTL to GDSII ASIC Physical Design</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-dim)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://github.com/Ishaan2005"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}
            >
              <Github size={13} />
              <span>GitHub</span>
            </a>
            <a
              href="mailto:engineer@example.com"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}
            >
              <Mail size={13} />
              <span>Contact</span>
            </a>
          </div>

          <button className="btn btn-primary" onClick={onClose}>
            Explore Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};
