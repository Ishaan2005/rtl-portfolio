import { RTLProject, RTLFile, RTLPort, SimulationResult, NetlistDiagramResult } from '../types/rtl';

const API_BASE =
  import.meta.env.VITE_API_BASE || '/api';

export function normalizeProjectForFrontend(project: RTLProject): RTLProject {
  if (project.id === 'mac_unit') {
    const macPorts: RTLPort[] = [
      {
        name: 'clk',
        direction: 'input',
        width: 1,
        domain: 'clk',
        description: 'Clock signal (50 MHz)',
      },
      {
        name: 'rst',
        direction: 'input',
        width: 1,
        domain: 'clk',
        description: 'Asynchronous active-high reset',
      },
      {
        name: 'in1',
        direction: 'input',
        width: 3,
        domain: 'clk',
        description: '3-bit multiplicand input operand [2:0]',
      },
      {
        name: 'in2',
        direction: 'input',
        width: 3,
        domain: 'clk',
        description: '3-bit multiplier input operand [2:0]',
      },
      {
        name: 'accumulator',
        direction: 'output',
        width: 7,
        domain: 'clk',
        description: '7-bit accumulated product output [6:0]',
      },
    ];

    const transformedFiles: RTLFile[] = (project.files || [])
      .filter((f) => !f.name.includes('master') && !f.name.includes('slave'))
      .map((f) => {
        let name = f.name;
        let id = f.id;
        let path = f.path;
        let content = f.content;
        let description = f.description;

        if (name === 'apb_top.v' || id === 'apb_top.v' || name === 'mac_top.v' || id === 'mac_top.v') {
          name = 'mac_top.v';
          id = 'mac_top.v';
          path = 'rtl/mac_top.v';
          description = 'Synthesizable module source (mac_top.v)';
          content = content.replace(/\bmodule\s+apb_top\b/g, 'module mac_top');
        } else if (name === 'apb_tb.v' || id === 'apb_tb.v' || name === 'mac_tb.v' || id === 'mac_tb.v') {
          name = 'mac_tb.v';
          id = 'mac_tb.v';
          path = 'tb/mac_tb.v';
          description = 'Verification testbench (mac_tb.v)';
          content = content
            .replace(/\bmodule\s+apb_tb\b/g, 'module mac_tb')
            .replace(/\bapb_top\b/g, 'mac_top')
            .replace(/\$dumpvars\(\s*0\s*,\s*apb_top\s*\)/g, '$dumpvars(0, mac_tb)');
        }

        return {
          ...f,
          id,
          name,
          path,
          description,
          content,
        };
      });

    return {
      ...project,
      topModule: 'mac_top',
      activeFileId: 'mac_top.v',
      ports: macPorts,
      files: transformedFiles,
      diagram: project.diagram
        ? {
            ...project.diagram,
            topModule: 'mac_top',
            title: 'mac_top Netlist Interconnect Diagram',
          }
        : project.diagram,
    };
  }
  return project;
}

export async function fetchProjects(): Promise<RTLProject[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`HTTP error ${res.status} when fetching projects`);
  const summaryList = await res.json();
  
  // Fetch full detail for each project
  const fullProjects = await Promise.all(
    summaryList.map(async (item: { id: string }) => {
      const pRes = await fetch(`${API_BASE}/projects/${item.id}`);
      if (!pRes.ok) throw new Error(`Failed to fetch project ${item.id}`);
      return pRes.json();
    })
  );
  return fullProjects.map(normalizeProjectForFrontend);
}

export async function runSimulation(
  projectId: string,
  onStageChange?: (stage: string) => void
): Promise<SimulationResult> {
  if (onStageChange) onStageChange('queued');
  
  await new Promise((r) => setTimeout(r, 150));
  if (onStageChange) onStageChange('compiling');

  const simPromise = fetch(`${API_BASE}/projects/${projectId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  await new Promise((r) => setTimeout(r, 200));
  if (onStageChange) onStageChange('simulating');

  const res = await simPromise;
  
  if (onStageChange) onStageChange('parsing');

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.stderr || `Simulation API HTTP error ${res.status}`);
  }

  const data = await res.json();
  
  if (onStageChange) onStageChange(data.success !== false ? 'completed' : 'failed');

  return {
    ...data,
    status: data.success !== false ? 'success' : 'failed',
    stage: data.success !== false ? 'completed' : 'failed'
  };
}

export async function fetchProjectDiagram(projectId: string): Promise<NetlistDiagramResult> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/diagram`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Diagram API error HTTP ${res.status}`);
  }
  return res.json();
}
