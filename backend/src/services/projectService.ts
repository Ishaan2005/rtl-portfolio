import fs from 'fs';
import path from 'path';
import { RTLProject, RTLFile, RTLPort, ProjectStats } from '../types/index.js';

export interface ProjectManifest {
  id: string;
  name: string;
  subtitle?: string;
  category?: string;
  description: string;
  topModule: string;
  rtlDirectory: string;
  testbenchDirectory: string;
  topTestbench?: string;
  simulator: 'iverilog' | 'verilator';
  standard?: string;
  timescale?: string;
  supportsSimulation: boolean;
  supportsWaveform: boolean;
  supportsGDS: boolean;
  architectureDetails?: string[];
  tags?: string[];
  stats?: ProjectStats;
  ports?: RTLPort[];
}

const PROJECTS_DIR = path.resolve(process.cwd(), 'projects');

export async function getProjectManifest(projectId: string): Promise<ProjectManifest | null> {
  const manifestPath = path.join(PROJECTS_DIR, projectId, 'project.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const content = await fs.promises.readFile(manifestPath, 'utf-8');
  return JSON.parse(content) as ProjectManifest;
}

export async function getAllProjects(): Promise<RTLProject[]> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const entries = await fs.promises.readdir(PROJECTS_DIR, { withFileTypes: true });
  const projectFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const projects: RTLProject[] = [];
  for (const folder of projectFolders) {
    const proj = await getFullProject(folder);
    if (proj) {
      projects.push(proj);
    }
  }
  return projects;
}

export async function getFullProject(projectId: string): Promise<RTLProject | null> {
  // Sanitize project ID
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    return null;
  }

  const manifest = await getProjectManifest(projectId);
  if (!manifest) {
    return null;
  }

  const projectDir = path.join(PROJECTS_DIR, projectId);
  const rtlDir = path.join(projectDir, manifest.rtlDirectory || 'rtl');
  const tbDir = path.join(projectDir, manifest.testbenchDirectory || 'tb');

  const files: RTLFile[] = [];

  // Read RTL source files
  if (fs.existsSync(rtlDir)) {
    const rtlFilenames = await fs.promises.readdir(rtlDir);
    for (const name of rtlFilenames) {
      if (name.endsWith('.v') || name.endsWith('.sv') || name.endsWith('.vh')) {
        const filePath = path.join(rtlDir, name);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        files.push({
          id: name,
          name,
          path: `${manifest.rtlDirectory}/${name}`,
          type: 'source',
          language: name.endsWith('.sv') ? 'systemverilog' : 'verilog',
          content,
          description: `Synthesizable module source (${name})`
        });
      }
    }
  }

  // Read Testbench files
  if (fs.existsSync(tbDir)) {
    const tbFilenames = await fs.promises.readdir(tbDir);
    for (const name of tbFilenames) {
      if (name.endsWith('.v') || name.endsWith('.sv')) {
        const filePath = path.join(tbDir, name);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        files.push({
          id: name,
          name,
          path: `${manifest.testbenchDirectory}/${name}`,
          type: 'testbench',
          language: name.endsWith('.sv') ? 'systemverilog' : 'verilog',
          content,
          description: `Verification testbench (${name})`
        });
      }
    }
  }

  const defaultStats: ProjectStats = manifest.stats || {
    lutCount: 100,
    ffCount: 50,
    bramCount: 0,
    clockDomains: ['clk'],
    targetFmax: '250 MHz',
    estPower: '15.0 mW',
    fsmStates: 0
  };

  const defaultPorts: RTLPort[] = manifest.ports || [];

  return {
    id: manifest.id,
    title: manifest.name,
    subtitle: manifest.subtitle || 'Synthesizable Digital Hardware Architecture',
    category: manifest.category || 'Digital Microarchitecture',
    description: manifest.description,
    architectureDetails: manifest.architectureDetails || [],
    tags: manifest.tags || ['Verilog', 'RTL'],
    topModule: manifest.topModule,
    activeFileId: files[0]?.id || '',
    files,
    stats: defaultStats,
    ports: defaultPorts,
    simulation: {
      status: 'idle',
      timescale: manifest.timescale || '1ns / 1ps',
      totalCycles: 0,
      passedAssertions: 0,
      totalAssertions: 0,
      coveragePercent: 0,
      durationMs: 0,
      logs: [],
      waveforms: {
        timescale: manifest.timescale || '1ns / 1ps',
        timeUnits: 'ns',
        maxTime: 100,
        timeStep: 5,
        clocks: [],
        signals: []
      }
    },
    diagram: {
      title: `${manifest.topModule} Netlist Interconnect Diagram`,
      topModule: manifest.topModule,
      nodes: [],
      edges: []
    }
  };
}
