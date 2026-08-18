import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Cpu,
  Terminal,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { fetchProjectDiagram } from '../../services/api';
import { NetlistDiagramResult } from '../../types/rtl';

interface DiagramViewerProps {
  projectId: string;
  topModule: string;
}

const cleanDiagramSvg = (svg: string): string => {
  if (!svg) return '';
  return svg
    // Clean up $paramod names into clean readable module names:
    // e.g. $paramod$96ebe223...\\fifomem -> fifomem
    // e.g. $paramod\\rptr_empty\\ADDRSIZE=s32'000... -> rptr_empty
    .replace(/\$paramod(?:\$[0-9a-fA-F]+)?\\(\w+)(?:\\[^<]*)?/gi, '$1')
    // Remove raw 32-bit constant bitstrings and long binary noise
    .replace(/<text[^>]*>\s*(?:s?\d+'[bhdBHD][0-9a-fA-F_xXzZ]+|[01]{8,}|0x0+)\s*<\/text>/gi, '')
    .replace(/<tspan[^>]*>\s*(?:s?\d+'[bhdBHD][0-9a-fA-F_xXzZ]+|[01]{8,}|0x0+)\s*<\/tspan>/gi, '')
    // Remove cell_0000000... constant node labels
    .replace(/<text[^>]*class="[^"]*cell_[01]{8,}[^"]*"[^>]*>[\s\S]*?<\/text>/gi, '');
};

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ projectId, topModule }) => {
  const [diagramData, setDiagramData] = useState<NetlistDiagramResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // Pan and Zoom viewport state - clean 1.0 default diagram size
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  // Fetch real NetlistSVG schematic when projectId changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchProjectDiagram(projectId)
      .then((data) => {
        if (!isMounted) return;
        setDiagramData(data);
        setZoom(1.0);
        setPan({ x: 20, y: 20 });
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load NetlistSVG schematic:', err);
        setError(err.message || 'Failed to synthesize and render RTL schematic');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Handle Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.2));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 20, y: 20 });
  };

  const handleFit = () => {
    if (!containerRef.current || !svgWrapperRef.current) return;
    const svgElem = svgWrapperRef.current.querySelector('svg');
    if (!svgElem) return;

    const contWidth = containerRef.current.clientWidth - 40;
    const contHeight = containerRef.current.clientHeight - 40;
    const svgWidth = svgElem.viewBox?.baseVal?.width || svgElem.clientWidth || 1000;
    const svgHeight = svgElem.viewBox?.baseVal?.height || svgElem.clientHeight || 600;

    const scaleX = contWidth / svgWidth;
    const scaleY = contHeight / svgHeight;
    const bestScale = Math.min(scaleX, scaleY, 1.2);

    setZoom(Math.max(bestScale, 0.3));
    setPan({ x: 10, y: 10 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * zoomFactor, 0.2), 5));
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Export SVG handler
  const handleExportSvg = () => {
    if (!diagramData?.svg) return;
    const cleaned = cleanDiagramSvg(diagramData.svg);
    const blob = new Blob([cleaned], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topModule}_netlistsvg_schematic.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="schematic-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          <Loader2 size={18} className="spin-animation" />
          <span style={{ fontSize: '13px', letterSpacing: '0.05em' }}>
            SYNTHESIZING REAL RTL VIA YOSYS & NETLISTSVG...
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Elaborating AST hierarchy and routing structural schematic gates for {topModule}
        </div>
      </div>
    );
  }

  if (error || !diagramData?.svg) {
    return (
      <div className="schematic-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>RTL Synthesis / NetlistSVG Error</span>
        </div>
        <div style={{ maxWidth: '600px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          {error || 'Unable to generate schematic diagram.'}
        </div>
        {diagramData?.yosys?.stderr && (
          <pre style={{ maxWidth: '750px', maxHeight: '180px', overflowY: 'auto', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#b91c1c', textAlign: 'left' }}>
            {diagramData.yosys.stderr}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="schematic-container" ref={containerRef}>
      {/* Top Schematic Toolbar */}
      <div className="schematic-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#000000' }}>
            <Cpu size={16} style={{ color: '#0284c7' }} />
            {topModule} Gate-Level Netlist
          </span>
          <span className="badge badge-accent" style={{ fontSize: '11px', background: 'rgba(2, 132, 199, 0.15)', color: '#0369a1', border: '1px solid rgba(2, 132, 199, 0.4)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
            Yosys 0.60 + NetlistSVG
          </span>
          <span style={{ fontSize: '11px', color: '#713f12', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <Clock size={13} /> {diagramData.durationMs} ms
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="btn-group">
            <button className="btn btn-secondary btn-icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="btn btn-secondary btn-icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="btn btn-secondary btn-icon" onClick={handleFit} title="Fit to Screen">
              <Maximize2 size={14} />
            </button>
            <button className="btn btn-secondary btn-icon" onClick={handleReset} title="Reset View (100%)">
              <RotateCcw size={14} />
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '5px 12px', gap: '6px' }}
            onClick={() => setShowLogModal(true)}
            title="Inspect raw Yosys synthesis execution log"
          >
            <Terminal size={14} />
            <span>Yosys Log</span>
          </button>

          <button
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '5px 14px', gap: '6px' }}
            onClick={handleExportSvg}
            title="Download synthesized SVG netlist diagram"
          >
            <Download size={14} />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Viewport */}
      <div
        className="schematic-canvas netlistsvg-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div
          ref={svgWrapperRef}
          className="netlistsvg-render-wrapper"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            display: 'inline-block',
            padding: '24px',
          }}
          dangerouslySetInnerHTML={{ __html: cleanDiagramSvg(diagramData.svg) }}
        />

        {/* Floating Zoom Indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--border-mid)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)'
          }}
        >
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Yosys Log Modal */}
      {showLogModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '750px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-mid)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-dim)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Yosys Synthesis Pass Log ({topModule})
                </span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px' }}
                onClick={() => setShowLogModal(false)}
              >
                Close
              </button>
            </div>
            <div
              style={{
                padding: '14px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                flex: 1,
              }}
            >
              {diagramData.yosys?.stdout || 'No stdout recorded from Yosys synthesis.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
