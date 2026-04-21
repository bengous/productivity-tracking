# Self-Sovereign Productivity Toolkit

> Local-first productivity tooling around Super Productivity, Git, and Google Calendar.

## 🧠 Core Philosophy
This repository stores the tooling and documentation for a local-first productivity workflow. Personal task exports stay on disk and are ignored by Git.

*   **Local-First:** Built on [Super Productivity](https://super-productivity.com/), keeping data on your disk, not in the cloud.
*   **Git-Backed Tooling:** Scripts and methodology are versioned without storing task history.
*   **Anti-Drift:** Engineered with "hard" starts and background safety nets to reduce context drift.
*   **Calendar Projection:** Automatically syncs scheduled tasks to Google Calendar for time-blocking visibility.

## 📖 Documentation
*   [**System Architecture**](./docs/SYSTEM_ARCHITECTURE.md): The "How" and "Why" of the entire system (Start Here!).
*   [**Google Calendar Sync**](./docs/GOOGLE_CALENDAR_SYNC.md): Setup guide for the unidirectional sync tool.
*   [**Methodology**](./docs/methodology/): Guides on ADHD, Deep Work, and Time Boxing.
*   [**Shortcuts**](./docs/SHORTCUTS.md): Keyboard shortcuts for the workflow.

## 🚀 Quick Start

### 1. Installation
The system requires a specific directory structure to function (`~/projects/productivity-tracking`).

```bash
# Clone to the required location
mkdir -p ~/projects
git clone git@github.com:bengous/productivity-tracking.git ~/projects/productivity-tracking
cd ~/projects/productivity-tracking

# Install the CLI tool
./install_local.sh
```

### 2. Usage
The system is managed via the `work-session` CLI (aliased to `sync.sh`).

```bash
# Open the Interactive Menu
work-session

# Save public repo changes (Commit & Push)
work-session save

# Load your Brain (Pull & Rebase)
work-session load
```

## 📂 Structure
*   `superproductivity/backup/`: Local-only Super Productivity exports. Ignored by Git except `.gitkeep`.
*   `superproductivity/sync.sh`: The engine that drives the system.
*   `sp-to-gcal/`: The Google Calendar Sync tool (Node.js CLI).
*   `docs/`: The Knowledge Base.

---
*For a deep dive into how we engineered the automated trigger system and solved Wayland crashing issues, read [The Journey](./docs/SYSTEM_ARCHITECTURE.md).*
