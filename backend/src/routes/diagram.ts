import { Router, Request, Response } from 'express';
import { generateProjectDiagram } from '../services/netlistService.js';

export const diagramRouter = Router();

// GET /api/projects/:id/diagram - synthesize RTL and generate real NetlistSVG schematic
diagramRouter.get('/:id/diagram', async (req: Request, res: Response) => {
  const projectId = req.params.id;

  try {
    const result = await generateProjectDiagram(projectId);
    if (!result.success && !result.svg) {
      res.status(422).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    console.error(`[Diagram Route] Error generating schematic for '${projectId}':`, err);
    res.status(500).json({
      success: false,
      svg: '',
      topModule: projectId,
      runId: 'error',
      durationMs: 0,
      netlistSize: 0,
      svgSize: 0,
      error: err.message || 'Unknown NetlistSVG schematic generation error',
      yosys: {
        exitCode: 1,
        stdout: '',
        stderr: err.message || ''
      }
    });
  }
});
