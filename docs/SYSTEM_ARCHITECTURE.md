# The Automated Brain: An Anti-Drift Productivity System

## 1. The Problem: "The Drift"
As a developer with perfectionist tendencies and executive function challenges (specifically "drifting" between tasks and auditory memory issues), I needed a system that:
1.  **Visualizes Time:** I remember what I see, not what I hear.
2.  **Prevents Drifting:** I needed a "hard start" to the day to prevent wandering into random rabbit holes.
3.  **Leverages Dev Skills:** I am comfortable in the terminal and with Git.
4.  **Avoids the "Builder's Trap":** I must not build a tool from scratch (procrastination).

## 2. The Solution Strategy

### The Tool: Super Productivity
We selected **Super Productivity** over paid SaaS tools (Morgen, Sunsama) or generic To-Do lists.
* **Why:** It is open-source, local-first, and designed for developers.
* **Key Feature:** "LocalFile Sync." It saves the entire database to a single JSON file, which allows us to version control our life.

### The Architecture
Instead of relying on willpower, we engineered an automated pipeline:

| Component | Technology | Function |
| :--- | :--- | :--- |
| **The Vault** | **Git** | Stores the task database. Commits act as "Save Points." |
| **The Engine** | **Bash Script** | Handles the logic of pulling, pushing, and launching. |
| **The Projection** | **Node.js CLI** | Syncs tasks to Google Calendar (Unidirectional). |
| **The Trigger** | **Hyprland** | Forces a visual "Morning Standup" terminal on login. |
| **The Safety** | **Systemd** | Silently commits work every hour (background pulse). |

---

## 3. The Implementation

### A. The "Engine" (`sync.sh`)
We created a robust bash script (`superproductivity/sync.sh`) that acts as the interface between the App and Git.

**Key Logic:**
1.  **Load:** `git pull --rebase` (Syncs state across machines).
2.  **Save:** Checks for file changes -> `git commit` -> `git push`.
3.  **Sync:** Triggers `sp-to-gcal` to update Google Calendar.
4.  **Start:** A specific function to launch the app safely (see Troubleshooting).

### B. The Configuration (Super Productivity)
We configured the app to treat a specific file in our repo as its brain:
* **Settings -> Sync:** `LocalFile`
* **Path:** `~/projects/productivity-tracking/superproductivity/backup/super-productivity-backup.json`
* **Note:** We discovered the app actually writes to `__meta_` internally, so our tools read from that.

### C. The Calendar Projection (`sp-to-gcal`)
A custom TypeScript tool located in `sp-to-gcal/` that provides **Data Sovereignty with Convenience**.
*   **Read:** Parses the raw JSON brain (`__meta_`).
*   **Map:** Converts `plannedAt` and `dueWithTime` tasks into Calendar Events.
*   **Push:** Uses Google Calendar API (OAuth2) to Upsert (Update/Insert) events.
*   **Idempotency:** Tags events with `privateExtendedProperty` so we never create duplicates.

### D. The Automation (Hyprland & Systemd)

**1. The Morning "Splash Screen"**
We configured Hyprland (`~/.config/hypr/autostart.conf`) to launch a floating terminal immediately upon login.
* **The Command:** `exec-once = alacritty -e work-session start`
* **The Delay:** We added `sleep 5` to prevent race conditions (waiting for Wi-Fi/Wayland).
* **The Visual:** Window rules force this terminal to be **floating and centered**, demanding attention before work begins.

**2. The Safety Net**
We created a Systemd user timer (`brain-sync.timer`) that runs `work-session save` every hour. This ensures that if I "drift" and forget to close the app, my data is safe.

---

## 4. The Troubleshooting Saga (Lessons Learned)

This was the most critical part of the engineering process. We faced a persistent crash where the app would freeze ("Not Responding") when the automation terminal closed.

### Attempt 1: `nohup`
* **Logic:** "Run the process and ignore the hangup signal."
* **Result:** **FAILURE.** Electron apps on Wayland are sensitive to input/output pipes being cut.

### Attempt 2: `systemd-run`
* **Logic:** "Hand the process over to the Service Manager."
* **Result:** **FAILURE.** While it detached the process, the app struggled with Wayland environment variables, leading to rendering freezes.

### Attempt 3: `uwsm` (Universal Wayland Session Manager)
* **Logic:** "Use the native tool designed to wrap Wayland apps."
* **Result:** **PARTIAL SUCCESS.** It worked manually, but on reboot, the timing was too tight, leading to crashes.

### The Final Solution: `hyprctl dispatch`
* **Logic:** "Don't launch the app. Tell the Window Manager to launch it."
* **Command:** `hyprctl dispatch exec superproductivity`
* **Why it works:** The terminal sends a signal to Hyprland and immediately dies. Hyprland (which is persistent) spawns the app. There is **zero physical link** between the script and the app. **This solved the crash permanently.**

---

## 5. How to Use This System

### Daily Routine
1.  **Login:** The terminal pops up automatically. It pulls the latest plan.
2.  **The App Launches:** The terminal vanishes, leaving only the focus tool.
3.  **Work:** Use the Pomodoro timer.
4.  **Drift Check:** If I close the app by mistake, type `morning` in the terminal.

### Aliases
Added to `.zshrc` for muscle memory:
* `morning` -> Runs the start sequence.
* `save` -> Forces a git push.
* `brain` -> Opens the interactive CLI menu.

### Maintenance
* **New Machine Setup:** Clone repo -> Run `./install_local.sh`.
* **Config Updates:** Edit `dotfiles`, run `stow`.

---

*This system transforms "Productivity" from a willpower exercise into a compiled, automated binary.*
