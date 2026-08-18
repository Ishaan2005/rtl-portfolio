import { WaveformData, WaveformSignal, WaveformPoint } from '../types/index.js';

interface VcdVar {
  code: string;
  name: string;
  type: string;
  size: number;
  scope: string;
  fullName: string;
}

export function parseVcdContent(vcdText: string): WaveformData {
  const lines = vcdText.split(/\r?\n/);
  
  let timescaleUnit = 'ns';
  let timescaleMultiplier = 1; // multiplier to convert raw timestamp into nanoseconds
  
  const varsByCode = new Map<string, VcdVar>();
  const signalValuesByCode = new Map<string, WaveformPoint[]>();
  
  const scopeStack: string[] = [];
  let inDefinitions = true;
  let currentTime = 0;
  let maxTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (inDefinitions) {
      if (rawLine.startsWith('$timescale')) {
        // e.g. "$timescale 1ps $end" or multiline
        let tsContent = rawLine;
        while (!tsContent.includes('$end') && i + 1 < lines.length) {
          i++;
          tsContent += ' ' + lines[i].trim();
        }
        const match = tsContent.match(/(\d+)\s*(s|ms|us|ns|ps|fs)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          timescaleUnit = unit;
          if (unit === 's') timescaleMultiplier = num * 1e9;
          else if (unit === 'ms') timescaleMultiplier = num * 1e6;
          else if (unit === 'us') timescaleMultiplier = num * 1e3;
          else if (unit === 'ns') timescaleMultiplier = num * 1;
          else if (unit === 'ps') timescaleMultiplier = num * 1e-3;
          else if (unit === 'fs') timescaleMultiplier = num * 1e-6;
        }
      } else if (rawLine.startsWith('$scope')) {
        const parts = rawLine.split(/\s+/);
        if (parts.length >= 3) {
          scopeStack.push(parts[2]);
        }
      } else if (rawLine.startsWith('$upscope')) {
        scopeStack.pop();
      } else if (rawLine.startsWith('$var')) {
        // e.g. "$var wire 1 ! wclk $end" or "$var wire 8 " wdata [7:0] $end"
        const parts = rawLine.split(/\s+/);
        if (parts.length >= 5) {
          const type = parts[1];
          const size = parseInt(parts[2], 10) || 1;
          const code = parts[3];
          let name = parts[4];
          if (parts[5] && parts[5].startsWith('[')) {
            name += parts[5];
          }
          const scope = scopeStack.join('.');
          const fullName = scope ? `${scope}.${name}` : name;
          
          const varObj: VcdVar = { code, name, type, size, scope, fullName };
          varsByCode.set(code, varObj);
          signalValuesByCode.set(code, []);
        }
      } else if (rawLine.startsWith('$enddefinitions')) {
        inDefinitions = false;
      }
      continue;
    }

    // Processing Value Change Section
    if (rawLine.startsWith('#')) {
      const rawTimestamp = parseFloat(rawLine.slice(1));
      if (!isNaN(rawTimestamp)) {
        currentTime = rawTimestamp * timescaleMultiplier;
        if (currentTime > maxTime) {
          maxTime = currentTime;
        }
      }
      continue;
    }

    if (rawLine === '$dumpvars' || rawLine === '$end') {
      continue;
    }

    // Vector values: e.g. "b1010 !", "b00000000 #"
    if (rawLine.startsWith('b') || rawLine.startsWith('B') || rawLine.startsWith('r') || rawLine.startsWith('R')) {
      const parts = rawLine.slice(1).trim().split(/\s+/);
      if (parts.length >= 2) {
        const binVal = parts[0];
        const code = parts[1];
        const vObj = varsByCode.get(code);
        if (vObj) {
          const hexVal = binToHex(binVal, vObj.size);
          addValuePoint(signalValuesByCode, code, currentTime, hexVal);
        }
      }
      continue;
    }

    // 1-bit values: e.g. "0!", "1!", "x!", "z!"
    const firstChar = rawLine[0];
    if (firstChar === '0' || firstChar === '1' || firstChar === 'x' || firstChar === 'X' || firstChar === 'z' || firstChar === 'Z') {
      const code = rawLine.slice(1);
      const vObj = varsByCode.get(code);
      if (vObj) {
        const bitVal = firstChar === '1' ? 1 : firstChar === '0' ? 0 : firstChar.toUpperCase();
        addValuePoint(signalValuesByCode, code, currentTime, bitVal);
      }
    }
  }

  // Convert parsed signals into frontend WaveformData
  const signals: WaveformSignal[] = [];
  const clocks: Array<{ name: string; period: number; domain: string }> = [];

  // Group and prioritize top-level & DUT signals
  const allVars = Array.from(varsByCode.values());

  // Prioritize signals in testbench and DUT
  allVars.sort((a, b) => {
    const depthA = a.scope.split('.').length;
    const depthB = b.scope.split('.').length;
    if (depthA !== depthB) return depthA - depthB;
    return a.name.localeCompare(b.name);
  });

  const seenNames = new Set<string>();

  for (const v of allVars) {
    const rawValues = signalValuesByCode.get(v.code) || [];
    if (rawValues.length === 0) continue;

    // Clean display name
    const displayName = v.name;
    if (seenNames.has(v.fullName)) continue;
    seenNames.add(v.fullName);

    const isClock = displayName.toLowerCase().includes('clk') && v.size === 1;
    const isReset = displayName.toLowerCase().includes('rst') && v.size === 1;
    const isBus = v.size > 1;

    let color = '#38bdf8';
    if (isClock) {
      color = displayName.toLowerCase().includes('wclk') ? '#10b981' : '#06b6d4';
    } else if (isReset) {
      color = '#ef4444';
    } else if (displayName.toLowerCase().includes('full')) {
      color = '#f97316';
    } else if (displayName.toLowerCase().includes('empty')) {
      color = '#fbbf24';
    } else if (displayName.toLowerCase().includes('rdata') || displayName.toLowerCase().includes('rinc')) {
      color = '#22c55e';
    } else if (displayName.toLowerCase().includes('wptr') || displayName.toLowerCase().includes('rptr')) {
      color = '#a855f7';
    }

    if (isClock) {
      clocks.push({
        name: displayName,
        period: 10,
        domain: v.scope || 'DUT'
      });
    }

    signals.push({
      id: `sig_${v.code}`,
      name: displayName,
      type: isClock ? 'clock' : isBus ? 'bus' : 'wire',
      width: v.size,
      radix: isBus ? 'hex' : 'bin',
      domain: v.scope,
      color,
      values: rawValues
    });
  }

  return {
    timescale: `1ns / 1ps`,
    timeUnits: 'ns',
    maxTime: Math.max(maxTime, 100),
    timeStep: 5,
    clocks,
    signals
  };
}

function addValuePoint(
  map: Map<string, WaveformPoint[]>,
  code: string,
  time: number,
  value: string | number
) {
  const points = map.get(code);
  if (!points) return;

  const roundedTime = Math.round(time * 10) / 10;
  if (points.length > 0) {
    const last = points[points.length - 1];
    if (last.time === roundedTime) {
      last.value = value;
      return;
    }
    if (last.value === value) {
      // dedupe redundant points
      return;
    }
  }
  points.push({ time: roundedTime, value });
}

function binToHex(binStr: string, size: number): string {
  if (binStr.includes('x') || binStr.includes('X')) return 'XX';
  if (binStr.includes('z') || binStr.includes('Z')) return 'ZZ';
  
  const num = parseInt(binStr, 2);
  if (isNaN(num)) return binStr;
  
  const hexDigits = Math.ceil(size / 4);
  return num.toString(16).toUpperCase().padStart(hexDigits, '0');
}
