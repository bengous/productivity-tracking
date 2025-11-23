import { SpTask } from './sp-reader';

export interface EventCandidate {
  taskId: string;
  day: string;          // YYYY-MM-DD
  start: Date | null;   // null for all-day
  end: Date | null;
  allDay: boolean;
  summary: string;
  description: string;
}

export function mapTaskToEvents(task: SpTask, tz: string): EventCandidate[] {
  const candidates: EventCandidate[] = [];

  // Case 1: Explicitly Scheduled (plannedAt)
  if (task.plannedAt && task.timeEstimate && task.timeEstimate > 0) {
    const start = new Date(task.plannedAt);
    const end = new Date(start.getTime() + task.timeEstimate);
    const dayKey = start.toISOString().slice(0, 10);
    candidates.push({
      taskId: task.id,
      day: dayKey,
      start,
      end,
      allDay: false,
      summary: task.title,
      description: `SP task: ${task.title}`,
    });
  } 
  // Case 2: Deadlines (dueDay)
  else if (task.dueDay) {
    candidates.push({
      taskId: task.id,
      day: task.dueDay,
      start: null,
      end: null,
      allDay: true,
      summary: `[Due] ${task.title}`,
      description: `Deadline for SP task: ${task.title}`,
    });
  } 
  // Case 3: Retrospective (timeSpentOnDay)
  else if (task.timeSpentOnDay) {
    for (const [day, ms] of Object.entries(task.timeSpentOnDay)) {
      if (ms <= 0) continue;
      // Heuristic: Create a block starting at 9am (or stack them later if we get fancy)
      // For now, we just put them at a fixed time to visualize the "weight" of the day.
      const start = new Date(`${day}T09:00:00`); 
      const end = new Date(start.getTime() + ms);
      candidates.push({
        taskId: task.id,
        day,
        start,
        end,
        allDay: false,
        summary: `[Work] ${task.title}`,
        description: `Logged ${(ms / 3600000).toFixed(2)}h on SP task: ${task.title}`,
      });
    }
  }

  return candidates;
}
