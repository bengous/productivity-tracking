# The Automated Brain: Self-Sovereign Productivity System

> *"The repository is the single source of truth. It contains your Task Data, your Methodology, and your Tools."*

## 🧠 Core Philosophy
This is not just a todo list; it is a **"Live Brain"** system. It treats your productivity data as critical infrastructure, version-controlled alongside your code.

*   **Local-First:** Built on [Super Productivity](https://super-productivity.com/), keeping data on your disk, not in the cloud.
*   **Git-Backed:** Every task, note, and config is versioned. Time travel through your productivity history.
*   **Anti-Drift:** Engineered with "hard" starts (Hyprland triggers) and background safety nets (Systemd) to prevent ADHD drift.

## 📖 Documentation
*   [**System Architecture**](./docs/SYSTEM_ARCHITECTURE.md): The "How" and "Why" of the entire system (Start Here!).
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

# Save your Brain (Commit & Push)
work-session save

# Load your Brain (Pull & Rebase)
work-session load
```

## 📂 Structure
*   `superproductivity/backup/`: The raw JSON database (The Brain).
*   `superproductivity/sync.sh`: The engine that drives the system.
*   `docs/`: The Knowledge Base.

---
*For a deep dive into how we engineered the automated trigger system and solved Wayland crashing issues, read [The Journey](./docs/SYSTEM_ARCHITECTURE.md).*