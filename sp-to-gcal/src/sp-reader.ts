import fs from 'node:fs/promises';

export interface SpTask {
  id: string;
  title: string;
  dueDay?: string;
  dueWithTime?: number;
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
  let raw = await fs.readFile(spBackupPath, 'utf8');
  
  // Strip "pf_X.X__" prefix if present (Super Productivity internal format)
  if (raw.startsWith('pf_')) {
    const markerEnd = raw.indexOf('__');
    if (markerEnd !== -1) {
      raw = raw.substring(markerEnd + 2);
    }
  }

  return JSON.parse(raw);
}

export function getTasks(sp: any): SpTask[] {
  // Check for "mainModelData" (found in __meta_) or "data" (found in exports)
  const root = sp.mainModelData || sp.data || sp;
  const taskSection = root.task;
  
  if (!taskSection) {
    console.warn("Warning: Could not find 'task' section in SP backup.");
    return [];
  }

  return taskSection.ids.map((id: string) => taskSection.entities[id]);
}
