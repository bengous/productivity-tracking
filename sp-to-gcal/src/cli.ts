import { readFile } from 'node:fs/promises';
import { getAuthClient, upsertEvents, authorizeNewUser } from './gcal-client';
import { readSpData, getTasks } from './sp-reader';
import { mapTaskToEvents } from './mapper';
import path from 'path';

async function main() {
  // Load Config
  const configPath = path.resolve(__dirname, '../config.sp-gcal.json');
  const configRaw = await readFile(configPath, 'utf8');
  const config = JSON.parse(configRaw);

  // 1. Read SP Data
  const spBackupPath = path.resolve(__dirname, config.spBackupPath);
  console.log(`Reading Brain from: ${spBackupPath}`);
  
  const sp = await readSpData(spBackupPath);
  const tasks = getTasks(sp);
  console.log(`Loaded ${tasks.length} tasks.`);

  // 2. Map to Events
  const candidates = tasks.flatMap((t) => mapTaskToEvents(t, config.google.timeZone));
  console.log(`Identified ${candidates.length} syncable events (Planned, Deadlines, or Worklog).`);

  if (candidates.length === 0) {
    console.log("Nothing to sync.");
    return;
  }

  // 3. Authenticate
  let auth = await getAuthClient(config);
  
  // If no credentials set on the client, we need to authorize
  if (!auth.credentials || !auth.credentials.access_token) {
     auth = await authorizeNewUser(auth);
  }

  // 4. Sync
  await upsertEvents(auth, config.google.calendarId, candidates);
}

main().catch((e) => {
  console.error("\n❌ Fatal Error:", e);
  process.exit(1);
});
