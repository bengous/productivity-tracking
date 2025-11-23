# 🔄 Git Sync Setup & "Live Brain" Philosophy

This repository implements a **Self-Sovereign Productivity System**. Instead of relying on opaque cloud services, we use **Git** as the backend for the entire "Brain".

## 🧠 The Philosophy

1.  **Repo = Brain:** This repository contains everything: your task data (`.json`), your strategies (`.md`), and your tools (`.sh`).
2.  **Time Travel:** Git provides a complete history of your productivity. You can revert to any point in time.
3.  **Snapshotting:** When we "Save", we snapshot the **entire state** of your system, not just the task list.

## 🛠 The `sync.sh` Script

The core tool is `superproductivity/sync.sh`.

### Usage

```bash
./superproductivity/sync.sh [command]
```

If run without arguments, it opens an **Interactive Menu**.

### Commands

*   **`status`**: Checks the **entire repository** for changes.
    *   *Why?* Because changing a script or updating this doc is just as important as checking off a task. If *anything* changed, the Brain is "dirty".
*   **`save`**: Commits and Pushes all changes to `origin/master`.
    *   *Commit Message:* Automatically timestamped "Brain Dump: YYYY-MM-DD HH:MM".
*   **`load`**: Pulls the latest changes from `origin/master` (using `--rebase` and `--autostash` for safety).

## ⚙️ Configuration

*   **Repo Path:** `$HOME/projects/productivity-tracking`
*   **Backup File:** `superproductivity/backup/super-productivity-backup.json`
*   **Branch:** `master`

## ⚠️ Workflow Notes

1.  **Super Productivity App:** Configure the app to "Save to File" pointing to `superproductivity/backup/super-productivity-backup.json`.
2.  **Sync Conflict:** If you edit tasks on another machine, run `load` **before** starting your day to pull those changes.
3.  **App Refresh:** After running `load`, you must **restart/reload** the Super Productivity app so it reads the updated JSON file from disk.
