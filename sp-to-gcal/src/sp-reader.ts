import fs from 'node:fs/promises';

export interface SpTask {
  id: string;
  title: string;
  dueDay?: string;
  plannedAt?: number;
  timeEstimate?: number;
  timeSpentOnDay?: Record<string, number>;
  projectId?: string;
  tagIds?: string[];
  isDone?: boolean;
}

interface SpData {
  // The backup might be wrapped in a "data" property or be flat
  data?: {
    task: {
      ids: string[];
      entities: Record<string, SpTask>;
    };
  };
  // Or it might be directly at the root (older versions)
  task?: {
    ids: string[];
    entities: Record<string, SpTask>;
  };
}

export async function readSpData(spBackupPath: string): Promise<SpData> {
  const raw = await fs.readFile(spBackupPath, 'utf8');
  return JSON.parse(raw);
}

export function getTasks(sp: SpData): SpTask[] {
  // Check for "data" wrapper first, then fall back to root
  const taskSection = sp.data?.task || sp.task;
  
  if (!taskSection) {
    console.warn("Warning: Could not find 'task' section in SP backup.");
    return [];
  }

  return taskSection.ids.map((id) => taskSection.entities[id]);
}
