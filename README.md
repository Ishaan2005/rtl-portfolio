# SiliconForge — Interactive RTL & Digital ASIC Portfolio

SiliconForge is a professional web application and interactive portfolio built for semiconductor recruiters and engineering hiring managers. It provides an intuitive EDA-grade workstation interface backed by:
1. **Real-time Icarus Verilog compilation & simulation pipeline** with **VCD value change dump waveform extraction**.
2. **Real-time Yosys synthesis & NetlistSVG gate-level schematic generation pipeline**.

---

## 🏛️ System Architecture

```
rtl-portfolio/
├── README.md                              # Project documentation & run guide
├── package.json                           # Workspace runner scripts
├── backend/                               # Node.js + Express + TypeScript API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── projects/                          # Physical project directories (Single Source of Truth)
│   │   ├── async_fifo/
│   │   │   ├── project.json               # Physical project manifest
│   │   │   ├── rtl/                       # Physical Verilog synthesizable sources
│   │   │   │   ├── async_fifo.v
│   │   │   │   ├── fifomem.v
│   │   │   │   ├── rptr_empty.v
│   │   │   │   ├── wptr_full.v
│   │   │   │   ├── sync_r2w.v
│   │   │   │   └── sync_w2r.v
│   │   │   └── tb/
│   │   │       └── async_fifo_tb.v        # Physical verification testbench with $dumpfile("waveform.vcd")
│   │   └── riscv_alu/
│   │       ├── project.json
│   │       ├── rtl/
│   │       │   └── riscv_alu.sv
│   │       └── tb/
│   │           └── riscv_alu_tb.sv
│   └── src/
│       ├── index.ts                       # API server initialization & routing
│       ├── types/index.ts                 # Shared data contract & type definitions
│       ├── services/
│       │   ├── projectService.ts          # Filesystem scanner & manifest loader
│       │   ├── edaRunner.ts               # Real Icarus Verilog (iverilog & vvp) runner
│       │   ├── vcdParser.ts               # Real Value Change Dump (VCD) parser
│       │   ├── yosysRunner.ts             # Real Yosys RTL synthesis runner (JSON netlist)
│       │   └── netlistService.ts          # NetlistSVG schematic rendering orchestrator
│       └── routes/
│           ├── projects.ts                # Real endpoints: GET /api/projects, GET /api/projects/:id
│           ├── simulate.ts                # Real endpoint: POST /api/projects/:id/simulate
│           └── diagram.ts                 # Real endpoint: GET /api/projects/:id/diagram
└── frontend/                              # React 18 + TypeScript + Vite SPA
    ├── package.json
    ├── vite.config.ts                     # Vite proxy to backend API (port 3001)
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx                       # React DOM entry point
        ├── App.tsx                        # Workspace state coordinator & layout
        ├── index.css                      # EDA Dark Workstation design system
        ├── types/rtl.ts                   # TypeScript interfaces
        ├── services/
        │   └── api.ts                     # REST client with real execution pipeline
        ├── components/
        │   ├── layout/
        │   │   ├── Header.tsx             # Top bar: project switch, stats, live simulation stages
        │   │   ├── Sidebar.tsx            # File explorer tree & module I/O port inspector
        │   │   ├── TabBar.tsx             # Source, Simulation, Waveform, Diagram tabs
        │   │   └── StatusBar.tsx          # Timescale, lint status, top-module info
        │   ├── tabs/
        │   │   ├── SourceViewer.tsx       # Verilog syntax highlighter with line nums
        │   │   ├── SimulationTab.tsx      # Real execution logs, assertions & runtime
        │   │   ├── WaveformViewer.tsx     # Interactive digital timing analyzer (Real VCD data)
        │   │   ├── DiagramViewer.tsx      # Interactive Pan & Zoom Gate Schematic (Real Yosys + NetlistSVG SVG)
        │   │   └── ProjectOverviewTab.tsx # Architectural specs & CDC proofs
        │   └── modals/
        │       └── RecruiterModal.tsx     # Recruiter brief & skill highlights
```

---

## ⚡ Real RTL Schematic Generation Pipeline (Milestone 3)

When the user selects **"RTL Diagram"**:
1. **Validation & Security**: The backend strictly validates `projectId` and extracts synthesizable source files from `project.json`.
2. **Isolated Sandbox Allocation**: A temporary workspace is created (`temp_runs/yosys_<timestamp>_<uuid>`).
3. **Yosys Synthesis**: `D:\exe_isos\oss-cad-suite\bin\yosys.exe` is invoked with `-p "read_verilog -sv <files...>; hierarchy -top <top>; proc; opt; write_json netlist.json"`.
4. **AST Netlist Extraction**: The AST JSON netlist is read and validated.
5. **NetlistSVG Programmatic Invocation**: `E:\netlist\netlistsvg\built\index.js` renders the AST JSON using `E:\netlist\netlistsvg\lib\default.svg`.
6. **SVG Sanitization & Transmission**: Dangerous script vectors and event handlers are stripped.
7. **Frontend Visualization**: `DiagramViewer.tsx` renders the real SVG with full Pan, Zoom (10% to 500%), Fit-to-screen, SVG Export, and Yosys Synthesis Pass Log modal.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or newer)
- Icarus Verilog (`D:\iverilog\bin`)
- Yosys (`D:\exe_isos\oss-cad-suite\bin\yosys.exe`)
- NetlistSVG (`E:\netlist\netlistsvg`)

---

### Running the System

In terminal 1 (Backend EDA Engine):
```bash
cd backend
npm run dev
```
Backend API will start on **http://localhost:3001**.

In terminal 2 (Frontend Workstation UI):
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.
Select **"RTL Diagram"** to inspect the real Yosys + NetlistSVG schematic!
Click **"Run Simulation"** to trigger a real Icarus Verilog run and view the generated waveform.
