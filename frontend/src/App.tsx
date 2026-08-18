import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar, TabType } from './components/layout/TabBar';
import { StatusBar } from './components/layout/StatusBar';
import { SourceViewer } from './components/tabs/SourceViewer';
import { SimulationTab } from './components/tabs/SimulationTab';
import { WaveformViewer } from './components/tabs/WaveformViewer';
import { DiagramViewer } from './components/tabs/DiagramViewer';
import { RecruiterModal } from './components/modals/RecruiterModal';
import { fetchProjects, runSimulation } from './services/api';
import { fallbackProjects } from './services/fallbackData';
import { RTLProject, RTLFile, SimulationStage } from './types/rtl';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<RTLProject[]>(fallbackProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>('amba_apb3');
  const [activeFileId, setActiveFileId] = useState<string>('apb_top.v');
  const [activeTab, setActiveTab] = useState<TabType>('source');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStage, setSimulationStage] = useState<SimulationStage>('idle');
  const [hasSimRun, setHasSimRun] = useState<boolean>(false);
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState<boolean>(false);

  // Load physical project dataset from backend API in background
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchProjects();
        if (data && data.length > 0) {
          setProjects(data);
        }
      } catch (err) {
        console.error('Error loading projects from backend:', err);
      }
    }
    loadData();
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const activeFile =
    activeProject?.files.find((f) => f.id === activeFileId) || activeProject?.files[0];

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const nextProj = projects.find((p) => p.id === projectId);
    if (nextProj && nextProj.files.length > 0) {
      setActiveFileId(nextProj.files[0].id);
    }
    setSimulationStage('idle');
  };

  const handleSelectFile = (file: RTLFile) => {
    setActiveFileId(file.id);
    setActiveTab('source');
  };

  const handleRunSimulation = async () => {
    if (!activeProject || isSimulating) return;
    setIsSimulating(true);
    setSimulationStage('queued');

    try {
      const simResult = await runSimulation(activeProject.id, (stage) => {
        setSimulationStage(stage as SimulationStage);
      });
      
      // Update active project with real VCD waveform and real simulation logs
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProject.id ? { ...p, simulation: simResult } : p))
      );
      setHasSimRun(true);
      setSimulationStage('completed');
      
      // Switch tab to simulation so user sees immediate live output
      setActiveTab('simulation');
    } catch (err: any) {
      console.error('Simulation execution failed:', err);
      setSimulationStage('failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!activeProject || !activeFile) {
    return null;
  }

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onRunSimulation={handleRunSimulation}
        isSimulating={isSimulating}
        simulationStage={simulationStage}
        onOpenRecruiterModal={() => setIsRecruiterModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="app-body">
        {/* Left Hierarchy & Ports Sidebar */}
        <Sidebar
          project={activeProject}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
        />

        {/* Center/Right Content Workspace */}
        <main className="main-content">
          {/* Engineering Tab Navigation Bar */}
          <TabBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            activeFileName={activeFile.name}
            hasSimRun={hasSimRun}
          />

          {/* Viewport for Active Tab */}
          <div className="tab-viewport">
            {activeTab === 'source' && <SourceViewer file={activeFile} />}
            {activeTab === 'simulation' && (
              <SimulationTab
                simulation={activeProject.simulation}
                topModule={activeProject.topModule}
                onReRunSim={handleRunSimulation}
                isSimulating={isSimulating}
                simulationStage={simulationStage}
              />
            )}
            {activeTab === 'waveform' && (
              <WaveformViewer waveformData={activeProject.simulation.waveforms} />
            )}
            {activeTab === 'diagram' && (
              <DiagramViewer projectId={activeProject.id} topModule={activeProject.topModule} />
            )}
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        project={activeProject}
        activeFileName={activeFile.name}
        isSimulating={isSimulating}
      />

      {/* Recruiter Summary Modal */}
      <RecruiterModal
        isOpen={isRecruiterModalOpen}
        onClose={() => setIsRecruiterModalOpen(false)}
      />
    </div>
  );
};
