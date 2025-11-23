# Productivity Tracking System ("Live Brain")

This repository hosts a **Self-Sovereign Productivity System** built on [Super Productivity](https://super-productivity.com/) and **Git**. It is designed to be a complete "Live Brain" that version-controls not just your tasks, but your entire productivity methodology, strategies, and tooling.

## 🧠 Core Philosophy

*   **Repo = Brain:** The repository is the single source of truth. It contains your Task Data (`.json`), your Methodology (`.md`), and your Tools (`.sh`).
*   **Local-First:** Data lives on your disk, not in a proprietary cloud.
*   **Time Travel:** Git history provides an immutable record of your productivity evolution.
*   **ADHD-Focused:** The workflow is optimized for ADHD minds, featuring "Soft Boxing," "Visual Anchors," and "Panic Boxes."

## 📂 Directory Structure

*   `superproductivity/sync.sh`: The core CLI tool for managing the system.
*   `superproductivity/backup/`: Contains the `super-productivity-backup.json` file, which the app reads/writes.
*   `docs/`: The Knowledge Base.
    *   `docs/methodology/`: Guides on ADHD, Deep Work, Time Boxing, and your Personal Playbook.
    *   `docs/GIT_SYNC_SETUP.md`: Technical documentation for the sync workflow.
    *   `docs/SHORTCUTS.md`: Essential keyboard shortcuts.

## 🛠 Usage (The "Sync" Tool)

The system is managed via the `sync.sh` script.

### Interactive Mode
Run without arguments to open the menu:
```bash
./superproductivity/sync.sh
```

### CLI Commands
*   **Check Status:**
    ```bash
    ./superproductivity/sync.sh status
    ```
    Checks the **entire repository** for changes. If *any* file (script, doc, or backup) has changed, the brain is considered "dirty."

*   **Save (Commit & Push):**
    ```bash
    ./superproductivity/sync.sh save
    ```
    Snapshots the entire system state, commits with a timestamp ("Brain Dump"), and pushes to `origin/master`.

*   **Load (Pull):**
    ```bash
    ./superproductivity/sync.sh load
    ```
    Pulls the latest changes from GitHub using `rebase` and `autostash`. **Note:** You must restart/reload the Super Productivity app after loading to see changes.

## ⚠️ Workflow Notes

1.  **App Configuration:** Ensure Super Productivity is set to "Save to File" pointing to `superproductivity/backup/super-productivity-backup.json`.
2.  **Sync Conflicts:** Always run `load` **before** starting your work day if you use multiple machines.
3.  **Development:** When modifying the system (e.g., editing `sync.sh` or `docs/`), use the `save` command to version control your changes alongside your task data.
