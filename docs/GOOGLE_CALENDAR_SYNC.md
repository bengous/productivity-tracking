# Google Calendar Sync Integration

The **Live Brain** system includes a custom tool (`sp-to-gcal`) that projects your local Super Productivity tasks onto your Google Calendar. This allows for time-blocking visibility without giving up data sovereignty.

## 🔄 Data Flow (Unidirectional)

1.  **Source:** Super Productivity writes state to `superproductivity/backup/__meta_`.
2.  **Trigger:** `work-session save` (via `sync.sh`) commits changes to Git.
3.  **Sync Tool:** Immediately after the commit/push, `sp-to-gcal` runs.
4.  **Destination:** Google Calendar (Primary).

**Note:** This is a **One-Way Sync**. Changes made in Google Calendar are **NOT** synced back to Super Productivity. The local repo is the Source of Truth.

## 🛠️ Technical Setup

The tool is a Node.js/TypeScript CLI located in `~/projects/productivity-tracking/sp-to-gcal`.

### Dependencies
*   Node.js
*   `googleapis` (npm package)
*   Google Cloud Platform Project (OAuth2 Client)

### Configuration
Config file: `sp-to-gcal/config.sp-gcal.json`

```json
{
  "spBackupPath": "../superproductivity/backup/__meta_",
  "google": {
    "credentialsPath": "credentials.json",
    "tokenPath": "token.json",
    "calendarId": "primary",
    "timeZone": "Europe/Paris"
  }
}
```

*   **`spBackupPath`**: Points to `__meta_` because we discovered SP v10+ writes live state there internally.

### Logic & Idempotency
To prevent duplicate events, the tool uses **Idempotency Keys**:
1.  When creating an event, it adds a `privateExtendedProperty` to the Google Event: `spTaskId: <TASK_ID>`.
2.  Before syncing, it fetches existing events and builds a map of `spTaskId -> googleEventId`.
3.  If a task exists, it **updates** (PATCH) the event.
4.  If a task is new, it **inserts** (POST) the event.

### Mapping Rules
Tasks are synced if they meet **any** of these criteria:
1.  **Scheduled:** Has a `plannedAt` time.
2.  **Timed Deadline:** Has a `dueWithTime` set (treated as a start time).
3.  **Deadlines:** Has a `dueDay` (synced as All-Day Event).
4.  **Worklog:** Has `timeSpentOnDay` (synced as a retrospective block).

## 🚀 Usage

### Automatic
Just use the standard workflow:
```bash
work-session save
```
The sync runs automatically after the git push.

### Manual
You can run the tool directly for debugging:
```bash
cd ~/projects/productivity-tracking/sp-to-gcal
npm run sync
```

## ⚠️ Troubleshooting

### "Localhost refused to connect" during Auth
This is normal during the initial setup (OAuth flow).
1.  Copy the `code=...` part from the URL bar of the error page.
2.  Paste it into the terminal prompt.
3.  This generates `token.json` and you won't need to do it again.

### Task not showing up?
1.  Check if the task has a **Schedule** time or **Due Date**.
2.  Check if the task is in the "Backlog" (Backlog tasks are ignored).
3.  Run `npm run sync` manually to see logs.

### "Unsaved changes" warning
The tool reads from `__meta_`. If Super Productivity hasn't flushed its state to disk, the sync tool won't see the changes.
**Fix:** Click a different task or modify a setting in SP to force a disk write before running `save`.
