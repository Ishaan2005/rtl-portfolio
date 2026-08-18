import React, { useState, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { WaveformData, WaveformSignal } from '../../types/rtl';

interface WaveformViewerProps {
  waveformData: WaveformData;
}

export const WaveformViewer: React.FC<WaveformViewerProps> = ({ waveformData }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // px per ns
  const [cursorTime, setCursorTime] = useState<number | null>(45);
  const [markerTime, setMarkerTime] = useState<number | null>(25);
  const [radixMap, setRadixMap] = useState<Record<string, 'hex' | 'bin' | 'dec'>>({});

  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const maxTime = waveformData.maxTime;
  const totalWidth = maxTime * zoomLevel * 8; // scaled width

  // Generate tick marks along the time ruler
  const ticks = useMemo(() => {
    const arr = [];
    const step = 10; // 10ns intervals
    for (let t = 0; t <= maxTime; t += step) {
      arr.push(t);
    }
    return arr;
  }, [maxTime]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasAreaRef.current) return;
    const rect = canvasAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(maxTime, Math.round((x / (zoomLevel * 8)) * 10) / 10));
    setCursorTime(time);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasAreaRef.current) return;
    const rect = canvasAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(maxTime, Math.round((x / (zoomLevel * 8)) * 10) / 10));
    setMarkerTime(time);
  };

  const toggleRadix = (sigId: string, currentRadix: 'hex' | 'bin' | 'dec') => {
    const nextRadix: 'hex' | 'bin' | 'dec' =
      currentRadix === 'hex' ? 'bin' : currentRadix === 'bin' ? 'dec' : 'hex';
    setRadixMap((prev) => ({ ...prev, [sigId]: nextRadix }));
  };

  const formatBusValue = (val: string | number, radix: 'hex' | 'bin' | 'dec', width: number): string => {
    if (val === 'XX' || val === 'ZZ') return `${width}'b${val}`;
    const num = typeof val === 'number' ? val : parseInt(String(val), 16);
    if (isNaN(num)) return String(val);

    if (radix === 'bin') {
      const binStr = num.toString(2).padStart(width, '0');
      return `${width}'b${binStr}`;
    }
    if (radix === 'dec') {
      return `${width}'d${num.toString(10)}`;
    }
    // Default hex
    const hexDigits = Math.ceil(width / 4);
    const hexStr = num.toString(16).toUpperCase().padStart(hexDigits, '0');
    return `${width}'h${hexStr}`;
  };

  // Render SVG Path for 1-bit or Multi-bit Bus
  const renderSignalWaveform = (signal: WaveformSignal) => {
    const isBus = signal.type === 'bus' || signal.width > 1;
    const color = '#00ff00'; // Classical EDA phosphor green
    const rowHeight = 40;
    const topY = 6;
    const bottomY = 34;
    const midY = (topY + bottomY) / 2;

    if (!isBus) {
      // 1-bit Square Waveform
      let pathD = '';

      signal.values.forEach((pt, idx) => {
        const x = pt.time * zoomLevel * 8;
        const y = pt.value === 1 || pt.value === '1' ? topY : bottomY;

        if (idx === 0) {
          pathD += `M ${x} ${y}`;
        } else {
          const prevX = x;
          // Step transition
          pathD += ` H ${prevX} V ${y}`;
        }
      });

      // Extend to max time
      const finalX = maxTime * zoomLevel * 8;
      pathD += ` H ${finalX}`;

      return (
        <svg
          style={{ width: `${totalWidth}px`, height: `${rowHeight}px`, position: 'absolute', top: 0, left: 0 }}
        >
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    } else {
      // Multi-bit Bus Waveform (Hexagonal Bus transitions)
      const currentRadix = radixMap[signal.id] || signal.radix || 'hex';

      return (
        <svg
          style={{ width: `${totalWidth}px`, height: `${rowHeight}px`, position: 'absolute', top: 0, left: 0 }}
        >
          {signal.values.map((pt, idx) => {
            const nextPt = signal.values[idx + 1];
            const startX = pt.time * zoomLevel * 8;
            const endX = nextPt ? nextPt.time * zoomLevel * 8 : maxTime * zoomLevel * 8;
            const segmentWidth = endX - startX;
            const chamfer = Math.min(3, segmentWidth / 4);

            if (segmentWidth <= 0) return null;

            const pathD = `
              M ${startX + chamfer} ${topY}
              L ${endX - chamfer} ${topY}
              L ${endX} ${midY}
              L ${endX - chamfer} ${bottomY}
              L ${startX + chamfer} ${bottomY}
              L ${startX} ${midY}
              Z
            `;

            const displayVal = formatBusValue(pt.value, currentRadix, signal.width);

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  fill="rgba(0, 255, 0, 0.15)"
                  stroke={color}
                  strokeWidth="1.25"
                />
                {segmentWidth > 18 && (
                  <text
                    x={startX + segmentWidth / 2}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="#00ff00"
                    fontSize="11px"
                    fontWeight="700"
                  >
                    {displayVal}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      );
    }
  };

  const delta = cursorTime !== null && markerTime !== null ? Math.abs(cursorTime - markerTime) : null;
  const deltaFreq = delta && delta > 0 ? (1000 / delta).toFixed(1) : null;

  return (
    <div className="waveform-container">
      {/* Waveform Controls Header */}
      <div className="waveform-toolbar">
        <div className="waveform-tools-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#000000', fontWeight: 800 }}>Zoom:</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 8px' }}
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              title="Zoom out waveform timebase"
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '12px', minWidth: '45px', textAlign: 'center', color: '#000000', fontWeight: 800 }}>
              {zoomLevel.toFixed(2)}x
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 8px' }}
              onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
              title="Zoom in waveform timebase"
            >
              <ZoomIn size={14} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 8px' }}
              onClick={() => setZoomLevel(1.0)}
              title="Reset Zoom (1.0x)"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div style={{ height: '18px', width: '1px', backgroundColor: 'var(--border-title-block)' }} />

          {/* Measurements */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
            {cursorTime !== null && (
              <div>
                <span style={{ color: '#713f12', fontWeight: 700 }}>Cursor: </span>
                <span style={{ color: '#000000', fontWeight: 800 }}>{cursorTime.toFixed(1)} ns</span>
              </div>
            )}
            {markerTime !== null && (
              <div>
                <span style={{ color: '#713f12', fontWeight: 700 }}>Marker A: </span>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>{markerTime.toFixed(1)} ns</span>
              </div>
            )}
            {delta !== null && (
              <div>
                <span style={{ color: '#713f12', fontWeight: 700 }}>Δt: </span>
                <span style={{ color: '#059669', fontWeight: 800 }}>{delta.toFixed(1)} ns</span>
                {deltaFreq && (
                  <span style={{ color: '#713f12', marginLeft: '4px', fontWeight: 700 }}>({deltaFreq} MHz)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Waveform Split Viewport */}
      <div className="waveform-viewport">
        {/* Left Column: Signal Names & Radix */}
        <div className="waveform-names-column">
          <div className="waveform-name-header">
            <span>Signal Name</span>
            <span style={{ fontSize: '11px', color: '#000000', fontWeight: 800 }}>Radix</span>
          </div>

          {waveformData.signals.map((sig) => {
            const isBus = sig.type === 'bus' || sig.width > 1;
            const currentRadix = radixMap[sig.id] || sig.radix || 'hex';

            return (
              <div key={sig.id} className="waveform-name-row" title={`Domain: ${sig.domain || 'default'}`}>
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#000000', fontSize: '13px', fontWeight: 800 }}>{sig.name}</span>
                </div>

                {isBus && (
                  <button
                    onClick={() => toggleRadix(sig.id, currentRadix)}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-mid)',
                      color: '#000000',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontWeight: 800
                    }}
                    title="Click to toggle Hex / Bin / Dec radix"
                  >
                    {currentRadix}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Time Ruler & Signal Traces Canvas */}
        <div
          className="waveform-canvas-area"
          ref={canvasAreaRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{ width: `${totalWidth}px` }}
        >
          {/* Time Ruler */}
          <div className="time-ruler" style={{ width: `${totalWidth}px` }}>
            {ticks.map((t) => (
              <div
                key={t}
                className="time-tick"
                style={{ left: `${t * zoomLevel * 8}px` }}
              >
                {t}ns
              </div>
            ))}
          </div>

          {/* Waveform Rows */}
          {waveformData.signals.map((sig) => (
            <div key={sig.id} className="waveform-row" style={{ width: `${totalWidth}px` }}>
              {renderSignalWaveform(sig)}
            </div>
          ))}

          {/* Fixed Marker Line A */}
          {markerTime !== null && (
            <div
              className="cursor-line"
              style={{
                left: `${markerTime * zoomLevel * 8}px`,
                backgroundColor: 'var(--accent-cyan)',
                boxShadow: '0 0 6px rgba(6, 182, 212, 0.6)'
              }}
            >
              <div className="cursor-tooltip" style={{ backgroundColor: 'var(--accent-cyan)' }}>
                M1: {markerTime.toFixed(1)}ns
              </div>
            </div>
          )}

          {/* Interactive Mouse Hover Cursor */}
          {cursorTime !== null && (
            <div
              className="cursor-line"
              style={{ left: `${cursorTime * zoomLevel * 8}px` }}
            >
              <div className="cursor-tooltip">
                t: {cursorTime.toFixed(1)}ns
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
