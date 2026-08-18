import { Router, Request, Response } from 'express';
import { runRealSimulation } from '../services/edaRunner.js';

export const simulateRouter = Router();

// POST /api/projects/:id/simulate - trigger REAL RTL compilation, simulation & VCD parsing
simulateRouter.post('/:id/simulate', async (req: Request, res: Response) => {
  const projectId = req.params.id;

  try {
    const result = await runRealSimulation(projectId);
    res.json(result);
  } catch (err: any) {
    console.error(`[Simulation Route] Execution error on '${projectId}':`, err);
    res.status(500).json({
      success: false,
      exitCode: 1,
      durationMs: 0,
      runId: 'error',
      stdout: '',
      stderr: err.message || 'Unknown EDA execution error',
      logs: [
        {
          time: '0.00 ns',
          level: 'error',
          message: `[EDA Execution Error] ${err.message}`
        }
      ],
      passedAssertions: 0,
      totalAssertions: 0,
      coveragePercent: 0,
      waveforms: {
        timescale: '1ns / 1ps',
        timeUnits: 'ns',
        maxTime: 100,
        timeStep: 5,
        clocks: [],
        signals: []
      }
    });
  }
});
