import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, Download } from 'lucide-react';
import { RTLFile } from '../../types/rtl';

interface SourceViewerProps {
  file: RTLFile;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({ file }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const lines = useMemo(() => {
    return file.content.split('\n');
  }, [file.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Verilog / SystemVerilog Token Highlighter
  const highlightVerilogLine = (line: string): React.ReactNode => {
    if (line.trim().startsWith('//')) {
      return <span className="tok-comm">{line}</span>;
    }

    // Split line into tokens preserving separators
    const tokenRegex = /(\/\/.*$|`[a-zA-Z_0-9]+|"(?:\\.|[^"\\])*"|\b(?:module|endmodule|input|output|inout|wire|reg|logic|parameter|localparam|always|always_ff|always_comb|always_latch|begin|end|if|else|case|endcase|default|assign|posedge|negedge|initial|for|function|endfunction|task|endtask|generate|endgenerate|genvar|integer)\b|\b(?:\$display|\$finish|\$dumpfile|\$dumpvars|\$error|\$fatal|\$warning|\$info|\$signed|\$unsigned)\b|\b\d+'[bBoOdDhH][0-9a-fA-F_xXzZ]+|\b\d+\b|[()\[\]{};,]|<=|==|!==|===|!=|&&|\|\||>>|<<|>>>|\^|~|&|\||\+|\-|\*|\/)/g;

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.substring(lastIdx, match.index));
      }

      const tok = match[0];
      if (tok.startsWith('//')) {
        parts.push(<span key={match.index} className="tok-comm">{tok}</span>);
      } else if (tok.startsWith('`')) {
        parts.push(<span key={match.index} className="tok-dir">{tok}</span>);
      } else if (tok.startsWith('"')) {
        parts.push(<span key={match.index} className="tok-str">{tok}</span>);
      } else if (tok.startsWith('$')) {
        parts.push(<span key={match.index} className="tok-func">{tok}</span>);
      } else if (/^(module|endmodule|begin|end|if|else|case|endcase|default|assign|posedge|negedge|initial|for|function|endfunction|task|endtask|generate|endgenerate)$/.test(tok)) {
        parts.push(<span key={match.index} className="tok-kw">{tok}</span>);
      } else if (/^(input|output|inout|wire|reg|logic|parameter|localparam|integer|genvar|always|always_ff|always_comb|always_latch)$/.test(tok)) {
        parts.push(<span key={match.index} className="tok-type">{tok}</span>);
      } else if (/^(\d+'[bBoOdDhH][0-9a-fA-F_xXzZ]+|\d+)$/.test(tok)) {
        parts.push(<span key={match.index} className="tok-num">{tok}</span>);
      } else {
        parts.push(<span key={match.index} className="tok-sym">{tok}</span>);
      }

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx));
    }

    return parts;
  };

  return (
    <div className="source-viewer-container">
      {/* File Header Bar */}
      <div className="source-header-bar" style={{ justifyContent: 'flex-end', padding: '8px 16px' }}>
        <div className="source-actions" style={{ gap: '10px' }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-mid)', padding: '4px 10px', borderRadius: '6px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Find in file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', gap: '6px', borderRadius: '6px' }} onClick={handleCopy}>
            {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', gap: '6px', borderRadius: '6px' }} onClick={handleDownload}>
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="code-editor-layout">
        <div className="line-numbers">
          {lines.map((_, idx) => (
            <div key={idx} style={{ height: '22px', lineHeight: '22px' }}>
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="code-content">
          {lines.map((line, idx) => {
            const isMatch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div
                key={idx}
                style={{
                  height: '22px',
                  lineHeight: '22px',
                  backgroundColor: isMatch ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  borderRadius: isMatch ? '3px' : '0'
                }}
              >
                {highlightVerilogLine(line)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
