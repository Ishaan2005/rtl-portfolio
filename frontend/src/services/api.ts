import { RTLProject, SimulationResult, NetlistDiagramResult } from '../types/rtl';

const API_BASE =
  import.meta.env.VITE_API_BASE || '/api';

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
  return fullProjects;
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
