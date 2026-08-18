import fs from 'fs';
import path from 'path';
import Module from 'module';
import { runYosysSynthesis } from './yosysRunner.js';

// Ensure netlistsvg can resolve its dependencies (elkjs, onml, etc.) from backend node_modules
const backendNodeModules = path.resolve(process.cwd(), 'node_modules');
if (!(Module as any).globalPaths) {
  (Module as any).globalPaths = [];
}
if (!(Module as any).globalPaths.includes(backendNodeModules)) {
  (Module as any).globalPaths.push(backendNodeModules);
}

// Hook into _nodeModulePaths to guarantee fallback resolution
const originalNodeModulePaths = (Module as any)._nodeModulePaths;
(Module as any)._nodeModulePaths = function (from: string) {
  const paths = originalNodeModulePaths ? originalNodeModulePaths.call(this, from) : [];
  if (!paths.includes(backendNodeModules)) {
    paths.push(backendNodeModules);
  }
  return paths;
};

const nodeRequire = typeof require !== 'undefined' ? require : (0, eval)('require');

const NETLISTSVG_DIR = process.env.NETLISTSVG_DIR || 'E:\\netlist\\netlistsvg';
const NETLISTSVG_BUILT_PATH = path.join(NETLISTSVG_DIR, 'built', 'index.js');
const DEFAULT_SKIN_PATH = path.join(NETLISTSVG_DIR, 'lib', 'default.svg');

export interface NetlistDiagramResult {
  success: boolean;
  svg: string;
  topModule: string;
  runId: string;
  durationMs: number;
  netlistSize: number;
  svgSize: number;
  error?: string;
  yosys: {
    exitCode: number;
    stdout: string;
    stderr: string;
  };
}

export async function generateProjectDiagram(projectId: string): Promise<NetlistDiagramResult> {
  const startTime = Date.now();

  // 1. Run Yosys RTL Synthesis to produce Yosys JSON AST netlist
  const yosysResult = await runYosysSynthesis(projectId);

  if (!yosysResult.success || !yosysResult.netlistJson) {
    return {
      success: false,
      svg: '',
      topModule: yosysResult.topModule,
      runId: yosysResult.runId,
      durationMs: Date.now() - startTime,
      netlistSize: 0,
      svgSize: 0,
      error: `Yosys synthesis failed with exit code ${yosysResult.exitCode}`,
      yosys: {
        exitCode: yosysResult.exitCode,
        stdout: yosysResult.stdout,
        stderr: yosysResult.stderr
      }
    };
  }

  const netlistJsonStr = JSON.stringify(yosysResult.netlistJson);
  const netlistSize = Buffer.byteLength(netlistJsonStr, 'utf-8');

  // 2. Validate Netlistsvg library and skin existence
  if (!fs.existsSync(NETLISTSVG_BUILT_PATH)) {
    throw new Error(`NetlistSVG library entry not found at: ${NETLISTSVG_BUILT_PATH}`);
  }
  if (!fs.existsSync(DEFAULT_SKIN_PATH)) {
    throw new Error(`NetlistSVG skin SVG not found at: ${DEFAULT_SKIN_PATH}`);
  }

  // 3. Invoke NetlistSVG programmatic render API
  const skinData = await fs.promises.readFile(DEFAULT_SKIN_PATH, 'utf-8');
  const netlistsvg = nodeRequire(NETLISTSVG_BUILT_PATH);

  let rawSvg = '';
  try {
    rawSvg = await netlistsvg.render(skinData, yosysResult.netlistJson);
  } catch (renderErr: any) {
    return {
      success: false,
      svg: '',
      topModule: yosysResult.topModule,
      runId: yosysResult.runId,
      durationMs: Date.now() - startTime,
      netlistSize,
      svgSize: 0,
      error: `NetlistSVG render error: ${renderErr.message}`,
      yosys: {
        exitCode: yosysResult.exitCode,
        stdout: yosysResult.stdout,
        stderr: yosysResult.stderr
      }
    };
  }

  // 4. Sanitize SVG for safe browser embedding
  const sanitizedSvg = sanitizeSvgMarkup(rawSvg);
  const svgSize = Buffer.byteLength(sanitizedSvg, 'utf-8');

  return {
    success: true,
    svg: sanitizedSvg,
    topModule: yosysResult.topModule,
    runId: yosysResult.runId,
    durationMs: Date.now() - startTime,
    netlistSize,
    svgSize,
    yosys: {
      exitCode: yosysResult.exitCode,
      stdout: yosysResult.stdout,
      stderr: yosysResult.stderr
    }
  };
}

function sanitizeSvgMarkup(svgString: string): string {
  if (!svgString) return '';
  return svgString
    // Remove script tags and inline event handlers for security
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Clean up $paramod names into clean readable module names:
    // e.g. $paramod$96ebe223...\\fifomem -> fifomem
    // e.g. $paramod\\rptr_empty\\ADDRSIZE=s32'000... -> rptr_empty
    .replace(/\$paramod(?:\$[0-9a-fA-F]+)?\\(\w+)(?:\\[^<]*)?/gi, '$1')
    // Remove raw 32-bit constant bitstrings and long binary noise
    .replace(/<text[^>]*>\s*(?:s?\d+'[bhdBHD][0-9a-fA-F_xXzZ]+|[01]{8,}|0x0+)\s*<\/text>/gi, '')
    .replace(/<tspan[^>]*>\s*(?:s?\d+'[bhdBHD][0-9a-fA-F_xXzZ]+|[01]{8,}|0x0+)\s*<\/tspan>/gi, '')
    // Remove cell_0000000... constant node labels
    .replace(/<text[^>]*class="[^"]*cell_[01]{8,}[^"]*"[^>]*>[\s\S]*?<\/text>/gi, '');
}
