# SiliconForge — Interactive RTL & Digital ASIC Portfolio

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-brightgreen?style=for-the-badge&logo=github)](https://ishaan2005.github.io/rtl-portfolio/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

SiliconForge is a browser-based electronic design automation (EDA) portfolio workstation built to showcase digital logic design, verification methodologies, and ASIC front-end pipelines directly to semiconductor recruiters and engineering teams.

Explore the live web workstation here: **[https://ishaan2005.github.io/rtl-portfolio/](https://ishaan2005.github.io/rtl-portfolio/)**

---

## ⚡ Key Highlights

- **Interactive VCD Timing Analyzer**: Inspect multi-signal digital timing waveforms rendered dynamically from Value Change Dump (`.vcd`) simulation data.
- **RTL Synthesis & Gate Schematics**: Interactive gate-level vector schematics generated through Yosys and NetlistSVG, complete with pan, zoom (10% to 500%), and fit-to-view navigation.
- **Pre-Compiled Simulation Traces**: Explore self-checking testbench assertion logs, simulation metrics, and signal state transitions without requiring local EDA tool installations.
- **Architectural Specs & CDC Proofs**: In-depth documentation covering Clock Domain Crossing (CDC) synchronizer safety, Gray-code address pointer mathematics, and assertion coverage.

---



##  Local Development Setup

To run SiliconForge locally or connect it to a native EDA backend:

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **pnpm**
- *(Optional for live local compilation)*: Icarus Verilog (`iverilog`, `vvp`), Yosys, and NetlistSVG installed and added to your system `PATH`.

### 1. Clone the Repository
```bash
git clone [https://github.com/Ishaan2005/rtl-portfolio.git](https://github.com/Ishaan2005/rtl-portfolio.git)
cd rtl-portfolio
