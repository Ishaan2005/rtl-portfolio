import { Router, Request, Response } from 'express';
import { getAllProjects, getFullProject } from '../services/projectService.js';

export const projectsRouter = Router();

// GET /api/projects - list all physical projects discovered from manifests
projectsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await getAllProjects();
    const summary = projects.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      category: p.category,
      description: p.description,
      tags: p.tags,
      topModule: p.topModule,
      fileCount: p.files.length,
      stats: p.stats,
    }));
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: `Failed to load projects: ${err.message}` });
  }
});

// GET /api/projects/:id - get full project details with physical file sources
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await getFullProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: `Project '${req.params.id}' not found` });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: `Error loading project: ${err.message}` });
  }
});

// GET /api/projects/:id/files/:fileId - get physical file content
projectsRouter.get('/:id/files/:fileId', async (req: Request, res: Response) => {
  try {
    const project = await getFullProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: `Project '${req.params.id}' not found` });
      return;
    }

    const file = project.files.find((f) => f.id === req.params.fileId);
    if (!file) {
      res.status(404).json({ error: `File '${req.params.fileId}' not found in project` });
      return;
    }

    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: `Error loading file: ${err.message}` });
  }
});
