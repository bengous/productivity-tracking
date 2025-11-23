
# Super Productivity → Google Calendar Sync (SP → GCal)

This document explains how to build a **local script** that reads your Super Productivity “brain” JSON file and **automatically creates/updates events in Google Calendar**.

It’s designed for your “Live Brain” / local‑first setup:
- Super Productivity (SP) is the UI.
- A JSON backup file is the **source of truth**.
- Git keeps history.
- A small CLI script projects tasks into Google Calendar.

You can adapt this to TypeScript, JavaScript, Python, or any language that can:
1. Read a JSON file.
2. Call the **Google Calendar API** with OAuth2.

---

## 0. High‑Level Overview

### 0.1. Data Flow

1. **Super Productivity** writes tasks to a local JSON file (your backup / DB).
2. Your script reads this file.
3. It maps selected SP tasks → Google Calendar **events**.
4. It calls the **Google Calendar API** to `insert` or `update` those events.
5. It stores an association between each SP task and its corresponding GCal event so the sync is **idempotent** (no duplicates).

Google’s official quickstart for Node.js uses the same pattern: read a `credentials.json`, run an OAuth2 flow once, store a `token.json`, and then use the Calendar API client to create events. citeturn0search0  

For SP’s data, tasks are stored in a `task` section with an `ids` array and an `entities` map (`id → task`), as visible in Super Productivity’s GitHub issues that show the backup format. citeturn0search6turn0search2  

---

## 1. Prerequisites

### 1.1. Tools & Environment

- A Google account.
- Node.js ≥ 18 (or any runtime you prefer; examples below assume Node/TypeScript).
- Your **Super Productivity backup JSON** path, e.g.:  
  `~/projects/productivity-tracking/superproductivity/backup/super-productivity-backup.json`
- Git already set up for your “Live Brain” repo.

### 1.2. Calendar Strategy

Decide where you want these events to live:

- **Option 1: Primary calendar** (`"primary"`).  
- **Option 2: Dedicated calendar**, e.g. “Super Productivity”. This keeps SP events separate.

You can create an extra calendar inside Google Calendar’s web UI; its `calendarId` will usually be an email-like string.

---

## 2. Create a Google Cloud Project & Enable Calendar API

The official Google Calendar API quickstarts show the exact console flow; the steps below summarize that process for a **command‑line / desktop app**. citeturn0search0turn0search4  

### 2.1. Create a Google Cloud project

1. Go to Google Cloud Console.
2. Create a new project, e.g. `sp-to-gcal`.

### 2.2. Enable the Google Calendar API

1. In the project, go to **APIs & Services → Library**.
2. Search for **“Google Calendar API”**.
3. Click **Enable**. citeturn0search0  

### 2.3. Configure OAuth consent

1. Go to **APIs & Services → OAuth consent screen**.
2. For personal use, choose “External” or “Internal” depending on your account type.
3. Set an app name (e.g. `SP to GCal`), support email, etc.
4. Add scope: `.../auth/calendar` or `.../auth/calendar.events` when prompted later (or leave it for the credentials step).
5. Save.

### 2.4. Create OAuth client credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → OAuth client ID**.
3. Application type: **Desktop app** (or similar “Installed app”).
4. Name it `sp-to-gcal-cli`.
5. Download the resulting JSON file (often named `client_secret_XXX.json`).

Rename and move it into your repo or config path; for example:

```text
~/.config/sp-to-gcal/credentials.json
```

Do **not** commit this file to Git.

---

## 3. Understand the Super Productivity JSON Structure

Super Productivity stores its state in a single JSON blob; GitHub issues show example snapshots of this file. citeturn0search6turn0search2  

A simplified structure (adapted from those examples) looks like:

```jsonc
{
  "task": {
    "ids": ["TASK_1", "TASK_2"],
    "entities": {
      "TASK_1": {
        "id": "TASK_1",
        "title": "Download slides",
        "subTaskIds": [],
        "timeSpentOnDay": {
          "2025-11-05": 90708
        },
        "timeSpent": 90708,
        "timeEstimate": 0,
        "isDone": false,
        "created": 1762322490346,
        "attachments": [],
        "projectId": "INBOX_PROJECT",
        "dueDay": "2025-11-05",
        "modified": 1762322576605,
        "tagIds": []
      }
    }
  },
  "project": { ... },
  "tag": { ... },
  "timeTracking": { ... },
  "globalConfig": { ... },
  "pluginUserData": [],
  "pluginMetadata": []
}
```

Key fields for calendar sync:

- `id`: stable task identifier.
- `title`: event summary.
- `dueDay`: date string (`YYYY-MM-DD`) – useful for all‑day events.
- `plannedAt`: timestamp (if you use planning) – useful as event start.
- `timeEstimate`: planned duration in milliseconds.
- `timeSpentOnDay`: map from `YYYY-MM-DD` to milliseconds actually spent – useful to create retrospective blocks.

You can confirm your exact fields by inspecting your backup JSON with `jq`, `less`, or a small script.

---

## 4. Decide on a Mapping: SP Task → Calendar Event

There is no single “correct” mapping; you design it around your workflow. Below is a pragmatic default.

### 4.1. Which tasks become events?

You might choose tasks that:

- Have a `plannedAt` timestamp (explicitly scheduled work).
- Or have a `dueDay` (deadlines).
- Or have non‑zero `timeSpentOnDay` for the date you are exporting.
- Optionally: filter by tags (e.g. include `#deep-work`, exclude `#admin`).

### 4.2. Event fields mapping

For each task (and possibly per‑day slice):

- **Summary (`event.summary`)** = `task.title`.
- **Description (`event.description`)**:
  - Task notes (if you use them).
  - Optional: a mention of project, tags, or your repo path.
- **Start / End**:
  - If `plannedAt` exists:
    - `start` = `new Date(plannedAt)`.
    - Duration = `timeEstimate` (fallback: `timeSpentOnDay[day]` or a default, e.g. 25–50 minutes).
    - `end` = `start + duration`.
  - If only `dueDay` exists:
    - Create an **all‑day event** using `date` instead of `dateTime` in the Calendar API.
  - If only `timeSpentOnDay[day]` exists (retroactive worklog):
    - For each day `d`:
      - `start` = “09:00 local time on day `d`” (or any block you prefer).
      - `end` = `start + timeSpentOnDay[d]`.

### 4.3. Idempotency with extended properties

The Google Calendar API supports **extended properties** on events, including a private map of key/value pairs that only your calendar sees. citeturn0search1turn0search5  

Use them to identify where an event came from:

```jsonc
"extendedProperties": {
  "private": {
    "spTaskId": "TASK_1",
    "spDay": "2025-11-05"
  }
}
```

Your sync script can then:

- Query events by these properties or iterate through events and check.
- Avoid creating duplicates.
- Update or delete the correct event when the SP task changes.

---

## 5. Create the Local CLI Project

Below is an example layout for a Node/TypeScript CLI named `sp-to-gcal`:

```text
~/projects/productivity-tracking/sp-to-gcal/
├── package.json
├── tsconfig.json
├── src/
│   ├── config.ts
│   ├── sp-reader.ts
│   ├── gcal-client.ts
│   ├── mapper.ts
│   └── cli.ts
└── config.sp-gcal.json
```

### 5.1. Install dependencies

In your `sp-to-gcal` folder:

```bash
npm init -y
npm install googleapis
npm install --save-dev typescript ts-node @types/node
```

The `googleapis` package is the official Node client for Google APIs (including Calendar). citeturn0search0  

### 5.2. Configuration file

Create `config.sp-gcal.json`:

```json
{
  "spBackupPath": "/home/you/projects/productivity-tracking/superproductivity/backup/super-productivity-backup.json",
  "google": {
    "credentialsPath": "/home/you/.config/sp-to-gcal/credentials.json",
    "tokenPath": "/home/you/.config/sp-to-gcal/token.json",
    "calendarId": "primary",
    "timeZone": "Europe/Paris"
  },
  "rules": {
    "minMsToExport": 300000,
    "includeTags": ["#deep-work", "#code"],
    "excludeTags": ["#admin"]
  }
}
```

You can evolve these rules later as your workflow stabilizes.

---

## 6. Implement Google Calendar Authentication (OAuth2)

Google’s Node.js quickstart shows a reusable pattern for installed applications: read `credentials.json`, request an OAuth2 token, store it in `token.json`, and reuse it on future runs. citeturn0search0  

### 6.1. Scopes

At minimum you need:

```text
https://www.googleapis.com/auth/calendar
```

This scope allows full read/write access to your calendars. You can use a narrower scope (like `calendar.events`) if you only need event access.

### 6.2. Auth helper (pseudo‑TypeScript)

```ts
// src/gcal-client.ts
import { google } from 'googleapis';
import fs from 'node:fs/promises';
import path from 'node:path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

async function loadJSON(p: string) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

export async function getAuthClient(config: any) {
  const credentials = await loadJSON(config.google.credentialsPath);
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );

  const tokenPath = config.google.tokenPath;

  try {
    const token = await loadJSON(tokenPath);
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch {
    // First run: launch the manual flow
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this URL:
', authUrl);

    // You then read the code from stdin and exchange it for a token
    // as shown in Google's quickstart docs.
    // Once obtained, save to tokenPath and reuse on next runs.
    throw new Error('Token not found; run initial auth flow.');
  }
}
```

Refer to the quickstart for the full code that handles reading the authorization code from stdin and writing `token.json`. citeturn0search0  

---

## 7. Read SP JSON and Map Tasks to Events

### 7.1. Read SP backup

```ts
// src/sp-reader.ts
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
  // ...other sections omitted
}

export async function readSpData(spBackupPath: string): Promise<SpData> {
  const raw = await fs.readFile(spBackupPath, 'utf8');
  return JSON.parse(raw);
}

export function getTasks(sp: SpData): SpTask[] {
  return sp.task.ids.map((id) => sp.task.entities[id]);
}
```

### 7.2. Mapping logic

```ts
// src/mapper.ts
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
      description: `SP task ${task.id}`,
    });
  } else if (task.dueDay) {
    candidates.push({
      taskId: task.id,
      day: task.dueDay,
      start: null,
      end: null,
      allDay: true,
      summary: task.title,
      description: `SP task ${task.id} (due)`,
    });
  } else if (task.timeSpentOnDay) {
    for (const [day, ms] of Object.entries(task.timeSpentOnDay)) {
      if (ms <= 0) continue;
      const start = new Date(`${day}T09:00:00`); // local heuristic
      const end = new Date(start.getTime() + ms);
      candidates.push({
        taskId: task.id,
        day,
        start,
        end,
        allDay: false,
        summary: task.title,
        description: `SP task ${task.id} (${(ms / 3600000).toFixed(2)}h)`,
      });
    }
  }

  return candidates;
}
```

You can later integrate project names, tags, or notes into `description`.

---

## 8. Create / Update Events in Google Calendar

### 8.1. Using extended properties

According to Google’s docs, `extendedProperties.private` is a dictionary that is only visible for a given `calendarId` and can be used to store custom metadata like foreign IDs. citeturn0search1  

We’ll store `spTaskId` and `spDay` there to link back to SP.

### 8.2. Upsert events (Idempotent)

We implement an **idempotent sync** (Update vs Create) to avoid duplicates. We first query Google for all existing events tagged with our `spTaskId`, then decide whether to `insert` or `patch`.

```ts
// src/gcal-client.ts (continued)
import { google } from 'googleapis';
import { EventCandidate } from './mapper';

export async function upsertEvents(
  auth: any,
  calendarId: string,
  candidates: EventCandidate[],
) {
  const calendar = google.calendar({ version: 'v3', auth });

  // 1. Fetch existing future events to avoid duplicates.
  // We use the 'privateExtendedProperty' filter to only get events created by this tool.
  const listResponse = await calendar.events.list({
    calendarId,
    privateExtendedProperty: ['spTaskId'],
    maxResults: 2500,
  });

  const existingEvents = listResponse.data.items || [];
  const existingMap = new Map<string, string>(); // Map: spTaskId -> googleEventId

  for (const evt of existingEvents) {
    if (evt.extendedProperties?.private?.spTaskId) {
      existingMap.set(evt.extendedProperties.private.spTaskId, evt.id!);
    }
  }

  // 2. Upsert (Update or Insert)
  for (const c of candidates) {
    const body: any = {
      summary: c.summary,
      description: c.description,
      extendedProperties: {
        private: {
          spTaskId: c.taskId,
          spDay: c.day,
        },
      },
    };

    if (c.allDay) {
      body.start = { date: c.day };
      body.end = { date: c.day };
    } else if (c.start && c.end) {
      body.start = { dateTime: c.start.toISOString(), timeZone: 'Europe/Paris' };
      body.end = { dateTime: c.end.toISOString(), timeZone: 'Europe/Paris' };
    }

    const existingId = existingMap.get(c.taskId);

    if (existingId) {
      // UPDATE existing event
      console.log(`Updating event for Task ${c.taskId}`);
      await calendar.events.patch({
        calendarId,
        eventId: existingId,
        requestBody: body,
      });
    } else {
      // INSERT new event
      console.log(`Creating event for Task ${c.taskId}`);
      await calendar.events.insert({
        calendarId,
        requestBody: body,
      });
    }
  }
}
```

Google’s event methods (`events.insert`, `events.update`, `events.delete`) are documented in the Calendar API reference. citeturn0search1turn0search0  

---

## 9. CLI Entrypoint & Integration with Your “Brain”

### 9.1. CLI entrypoint

Create `src/cli.ts` that stitches everything together:

```ts
import { readFile } from 'node:fs/promises';
import { getAuthClient, upsertEvents } from './gcal-client';
import { readSpData, getTasks } from './sp-reader';
import { mapTaskToEvents } from './mapper';

async function main() {
  const config = JSON.parse(await readFile('config.sp-gcal.json', 'utf8'));

  const sp = await readSpData(config.spBackupPath);
  const tasks = getTasks(sp);

  const candidates = tasks.flatMap((t) => mapTaskToEvents(t, config.google.timeZone));

  const auth = await getAuthClient(config);
  await upsertEvents(auth, config.google.calendarId, candidates);

  console.log(`Synced ${candidates.length} events to Google Calendar.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add a script to `package.json`:

```json
{
  "scripts": {
    "sync": "ts-node src/cli.ts"
  }
}
```

Now you can run:

```bash
npm run sync
```

On the very first run, the auth helper will print an OAuth URL; open it, approve the app, paste the code back (as described in the quickstart). citeturn0search0  

### 9.2. Hook into `sync.sh` (save_brain)

In your `superproductivity/sync.sh`, extend `save_brain()`:

```bash
function save_brain() {
  if [[ -n $(git status -s) ]]; then
    log_info "Changes detected. Preparing to commit..."
    git add .

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M')

    if git commit -m "Brain Dump: $timestamp"; then
      git push origin master
      log_success "Successfully pushed to GitHub!"

      # New: project tasks into Google Calendar
      log_info "Syncing Super Productivity events to Google Calendar..."
      (cd ~/projects/productivity-tracking/sp-to-gcal && npm run sync)         || log_warn "Calendar sync failed"
    fi
  fi
}
```

This way, every time you “brain dump” to Git, your calendar projection is updated.

### 9.3. Optional: systemd timer

If you prefer time‑based sync (e.g. every 15 minutes), create:

`~/.config/systemd/user/sp-gcal-sync.service`:

```ini
[Unit]
Description=Sync Super Productivity to Google Calendar

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash -lc 'cd ~/projects/productivity-tracking/sp-to-gcal && npm run sync'
```

`~/.config/systemd/user/sp-gcal-sync.timer`:

```ini
[Unit]
Description=Run sp-to-gcal periodically

[Timer]
OnCalendar=*:0/15
Persistent=true

[Install]
WantedBy=timers.target
```

Then enable:

```bash
systemctl --user daemon-reload
systemctl --user enable --now sp-gcal-sync.timer
```

---

## 10. Testing & Troubleshooting

1. **Dry‑run mode**: Before calling the Calendar API, log the event payloads to be sure your mapping makes sense.
2. **Check time zones**:
   - Ensure you use the same `timeZone` string (`Europe/Paris`) in your event objects and config.
3. **Avoiding duplicates**:
   - Implement the `extendedProperties.private` approach and either:
     - Query events and update them, or
     - Store a local `eventId` mapping.
4. **Credential errors**:
   - If you change `credentials.json`, delete `token.json` and redo the OAuth authorization.
5. **Debugging SP data**:
   - Add a script that just prints a few tasks and their fields to confirm `dueDay`, `plannedAt`, and `timeSpentOnDay` are present as expected.

---

## 11. Future Extensions

Once the basic pipeline works, you can:

- Add **filters**:
  - Only export tasks from certain projects (e.g. “Work”, “SaaS”), or with certain tags.
- Add **bi‑directional hints**:
  - Store extra metadata in SP (via plugin or notes) with links to the corresponding GCal event.
- Consider a **native SP plugin** using `@super-productivity/plugin-api` (announced with full TypeScript support in v14) to get real-time events without parsing the backup file. citeturn0search3turn0search7  

---

## 12. References

- Google Calendar API – Node.js quickstart (authentication & basic calls). citeturn0search0  
- Google Calendar API – Extended properties (private vs shared). citeturn0search1  
- Super Productivity JSON structure examples and task storage (`task.ids`, `task.entities`). citeturn0search6turn0search2  
- Discussion of custom plugin API & TypeScript support via `@super-productivity/plugin-api`. citeturn0search3turn0search7  
- Example of using extended properties in Calendar events in code (Stack Overflow). citeturn0search5  
