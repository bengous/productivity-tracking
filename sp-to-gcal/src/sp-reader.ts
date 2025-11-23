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
  task: {
    ids: string[];
    entities: Record<string, SpTask>;
  };
  // ...other sections omitted as we don't need them yet
}

export async function readSpData(spBackupPath: string): Promise<SpData> {
  const raw = await fs.readFile(spBackupPath, 'utf8');
  return JSON.parse(raw);
}

export function getTasks(sp: SpData): SpTask[] {
  return sp.task.ids.map((id) => sp.task.entities[id]);
}
