export type FileType = 'source' | 'testbench' | 'header' | 'constraints';
export type Language = 'verilog' | 'systemverilog';

export interface RTLFile {
  id: string;
  name: string;
  path: string;
  type: FileType;
  language: Language;
  content: string;
  description: string;
}

export interface RTLPort {
  name: string;
  direction: 'input' | 'output' | 'inout';
  width: number;
  domain?: string;
  description: string;
}

export interface ProjectStats {
  lutCount: number;
  ffCount: number;
  bramCount: number;
  clockDomains: string[];
  targetFmax: string;
  estPower: string;
  fsmStates?: number;
}

export interface LogEntry {
  time: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
}

export interface WaveformPoint {
  time: number;
  value: string | number;
}

export interface WaveformSignal {
  id: string;
  name: string;
  type: 'wire' | 'reg' | 'bus' | 'clock';
  width: number;
  radix: 'hex' | 'bin' | 'dec' | 'ascii';
  domain?: string;
  color?: string;
  values: WaveformPoint[];
}

export interface WaveformData {
  timescale: string;
  timeUnits: string;
  maxTime: number;
  timeStep: number;
  clocks: Array<{ name: string; period: number; domain: string }>;
  signals: WaveformSignal[];
}

export interface SchematicNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'module' | 'dff' | 'mux' | 'comparator' | 'adder' | 'ram' | 'sync' | 'port_in' | 'port_out' | 'logic';
  x: number;
  y: number;
  width: number;
  height: number;
  inputs?: string[];
  outputs?: string[];
  details?: Record<string, string | number>;
}

export interface SchematicEdge {
  id: string;
  from: string;
  fromPort?: string;
  to: string;
  toPort?: string;
  label?: string;
  busWidth?: number;
  style?: 'clock' | 'bus' | 'wire' | 'async';
}

export interface DiagramData {
  title: string;
  topModule: string;
  nodes: SchematicNode[];
  edges: SchematicEdge[];
  svgMarkup?: string;
}

export interface SimulationResult {
  status: 'idle' | 'running' | 'success' | 'failed';
  timescale: string;
  totalCycles: number;
  passedAssertions: number;
  totalAssertions: number;
  coveragePercent: number;
  durationMs: number;
  logs: LogEntry[];
  waveforms: WaveformData;
}

export interface RTLProject {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  architectureDetails: string[];
  tags: string[];
  topModule: string;
  activeFileId: string;
  files: RTLFile[];
  stats: ProjectStats;
  ports: RTLPort[];
  simulation: SimulationResult;
  diagram: DiagramData;
}
