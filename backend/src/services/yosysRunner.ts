import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getProjectManifest } from './projectService.js';

const execFileAsync = promisify(execFile);

const YOSYS_DIR = process.env.YOSYS_BIN_DIR || '/usr/bin';
const YOSYS_PATH = path.join(YOSYS_DIR, 'yosys.exe');
const YOSYS_LIB_DIR = path.resolve(YOSYS_DIR, '..', 'lib');

const PROJECTS_DIR = path.resolve(process.cwd(), 'projects');
const TEMP_RUNS_DIR = path.resolve(process.cwd(), 'temp_runs');

export interface YosysSynthesisResult {
  success: boolean;
  exitCode: number;
  durationMs: number;
  runId: string;
  topModule: string;
  stdout: string;
  stderr: string;
  netlistJson: any | null;
}

export async function runYosysSynthesis(projectId: string): Promise<YosysSynthesisResult> {
  const startTime = Date.now();
  const runId = `yosys_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  // 1. Security Check: Validate Project ID
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    throw new Error(`Invalid project identifier format: '${projectId}'`);
  }

  const manifest = await getProjectManifest(projectId);
  if (!manifest) {
    throw new Error(`Project manifest for '${projectId}' was not found`);
  }

  // 2. Validate Yosys Toolchain
  if (!fs.existsSync(YOSYS_PATH)) {
    throw new Error(`Yosys executable not found at: ${YOSYS_PATH}`);
  }

  // 3. Resolve RTL Sources strictly from manifest
  const projectDir = path.join(PROJECTS_DIR, projectId);
  const rtlDir = path.join(projectDir, manifest.rtlDirectory || 'rtl');

  if (!fs.existsSync(rtlDir)) {
    throw new Error(`RTL directory does not exist for project '${projectId}'`);
  }

  const files = await fs.promises.readdir(rtlDir);
  const sourceFiles: string[] = [];
  for (const f of files) {
    if (f.endsWith('.v') || f.endsWith('.sv')) {
      sourceFiles.push(path.join(rtlDir, f).replace(/\\/g, '/'));
    }
  }

  if (sourceFiles.length === 0) {
    throw new Error(`No synthesizable source files (.v / .sv) found in project '${projectId}'`);
  }

  // 4. Create Isolated Run Directory
  const runDir = path.join(TEMP_RUNS_DIR, runId);
  await fs.promises.mkdir(runDir, { recursive: true });

  const netlistJsonPath = path.join(runDir, 'netlist.json').replace(/\\/g, '/');

  // 5. Construct Yosys Synthesis Command
  // Command: read_verilog -sv <files>; hierarchy -top <top>; proc; opt; write_json netlist.json
  const fileArgs = sourceFiles.join(' ');
  const yosysScript = `read_verilog -sv ${fileArgs}; hierarchy -top ${manifest.topModule}; proc; opt; write_json "${netlistJsonPath}"`;

  // Build PATH with OSS CAD Suite libraries
  const customPath = `${YOSYS_DIR};${YOSYS_LIB_DIR};${process.env.PATH || ''}`;

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const res = await execFileAsync(YOSYS_PATH, ['-p', yosysScript], {
      cwd: runDir,
      env: {
        ...process.env,
        PATH: customPath
      },
      timeout: 15000,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });

    stdout = res.stdout || '';
    stderr = res.stderr || '';
  } catch (err: any) {
    exitCode = err.code || 1;
    stdout = err.stdout || '';
    stderr = err.stderr || err.message || '';
  }

  // 6. Read back generated JSON netlist if synthesis succeeded
  let netlistJson: any = null;
  if (fs.existsSync(netlistJsonPath)) {
    try {
      const content = await fs.promises.readFile(netlistJsonPath, 'utf-8');
      netlistJson = JSON.parse(content);
    } catch (parseErr) {
      console.error(`Failed to parse Yosys generated netlist JSON for ${projectId}:`, parseErr);
    }
  }

  return {
    success: exitCode === 0 && netlistJson !== null,
    runId,
    topModule: manifest.topModule,
    netlistJson,
    stdout,
    stderr,
    exitCode,
    durationMs: Date.now() - startTime
  };
}
