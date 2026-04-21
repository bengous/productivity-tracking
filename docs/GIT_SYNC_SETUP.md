# 🔄 Git Sync Setup

This repository implements the public tooling for a local-first Super Productivity workflow. Git stores scripts and documentation; personal task exports stay local and ignored.

## 🧠 The Philosophy

1.  **Repo = Toolkit:** This repository contains scripts, setup docs, and methodology.
2.  **Private by Default:** Super Productivity exports, OAuth tokens, and credentials are ignored by Git.
3.  **Snapshotting:** When we "Save", we commit public repo changes only.

## 🛠 The `sync.sh` Script

The core tool is `superproductivity/sync.sh`.

### Usage

```bash
./superproductivity/sync.sh [command]
```

If run without arguments, it opens an **Interactive Menu**.

### Commands

*   **`status`**: Checks the repository for public changes.
    *   Ignored private data under `superproductivity/backup/` is not committed.
*   **`save`**: Commits and pushes public changes to `origin/master`.
    *   *Commit Message:* Automatically timestamped "Brain Dump: YYYY-MM-DD HH:MM".
*   **`load`**: Pulls the latest changes from `origin/master` (using `--rebase` and `--autostash` for safety).
*   **`start`**: Pulls latest changes (`load`) and then launches Super Productivity.
    *   *Tech Note:* Uses `systemd-run --scope` and native Wayland flags (`--ozone-platform=wayland`) to prevent freezing issues on Hyprland.

## ⚙️ Configuration

*   **Repo Path:** `$HOME/projects/productivity-tracking`
*   **Backup File:** `superproductivity/backup/super-productivity-backup.json` (local-only, ignored by Git)
*   **Branch:** `master`

## ⚠️ Workflow Notes

1.  **Super Productivity App:** Configure the app to "Save to File" pointing to `superproductivity/backup/super-productivity-backup.json`.
2.  **Sync Conflict:** If you edit tasks on another machine, run `load` **before** starting your day to pull those changes.
3.  **App Refresh:** After running `load`, you must **restart/reload** the Super Productivity app so it reads the updated JSON file from disk.
