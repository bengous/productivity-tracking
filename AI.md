# Productivity Tracking System

This repository hosts a **Self-Sovereign Productivity System** built on [Super Productivity](https://super-productivity.com/) and **Git**. It version-controls the public tooling and documentation for the workflow; personal Super Productivity exports stay local and ignored.

## 🧠 Core Philosophy

*   **Repo = Toolkit:** The repository contains scripts, setup docs, and reusable methodology.
*   **System Root:** The repository **MUST** be located at `~/projects/productivity-tracking`. The internal scripts (`sync.sh`) and installation tools (`install_local.sh`) rely on this absolute path to function correctly.
*   **Local-First:** Data lives on your disk, not in a proprietary cloud.
*   **Private by Default:** Task exports, notes, time tracking data, OAuth tokens, and credentials are not committed.
*   **ADHD-Focused:** The workflow is optimized for ADHD minds, featuring "Soft Boxing," "Visual Anchors," and "Panic Boxes."

## 📂 Directory Structure

*   `install_local.sh`: Automated installer to link the sync script to your PATH.
*   `superproductivity/sync.sh`: The core CLI tool for managing the system (aliased as `work-session`).
*   `superproductivity/backup/`: Local-only Super Productivity exports. Ignored by Git except `.gitkeep`.
*   `docs/`: The Knowledge Base.
    *   `docs/SYSTEM_ARCHITECTURE.md`: **(NEW)** The comprehensive architectural overview, troubleshooting log, and "Anti-Drift" philosophy. **Read this for deep context.**
    *   `docs/methodology/`: Guides on ADHD, Deep Work, and Time Boxing.
    *   `docs/GIT_SYNC_SETUP.md`: Technical documentation for the sync workflow.
    *   `docs/SHORTCUTS.md`: Essential keyboard shortcuts.

## 🛠 Usage (The "Sync" Tool)

The system is managed via the `sync.sh` script. If installed via `install_local.sh`, you can run it globally as `work-session`.

### Interactive Mode
Run without arguments to open the menu:
```bash
work-session
# OR
./superproductivity/sync.sh
```

### CLI Commands
*   **Check Status:**
    ```bash
    ./superproductivity/sync.sh status
    ```
    Checks the repository for public changes. Ignored private backups are not committed.

*   **Save (Commit & Push):**
    ```bash
    ./superproductivity/sync.sh save
    ```
    Commits public repo changes with a timestamp ("Brain Dump") and pushes to `origin/master`.

*   **Load (Pull):**
    ```bash
    ./superproductivity/sync.sh load
    ```
    Pulls the latest changes from GitHub using `rebase` and `autostash`. **Note:** You must restart/reload the Super Productivity app after loading to see changes.

## ⚠️ Workflow Notes

1.  **App Configuration:** Ensure Super Productivity is set to "Save to File" pointing to `superproductivity/backup/super-productivity-backup.json`.
2.  **Sync Conflicts:** Always run `load` **before** starting your work day if you use multiple machines.
3.  **Development:** When modifying the system (e.g., editing `sync.sh` or `docs/`), use the `save` command to version control public repo changes.
