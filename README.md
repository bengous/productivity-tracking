# Productivity Tracking

Personal productivity system using [Super Productivity](https://super-productivity.com/) with git-based backup.

## Installation

### 1. Prerequisites
This system depends on **Super Productivity** being installed.
- **Arch Linux:** `yay -S superproductivity-bin`
- **Other Distros:** [Download Official App](https://super-productivity.com/)

### 2. Clone Repository
The system scripts depend on a specific path. Clone this repository to:
```bash
mkdir -p ~/projects
git clone git@github.com:bengous/productivity-tracking.git ~/projects/productivity-tracking
cd ~/projects/productivity-tracking
```

### 3. CLI Tool Setup
To use the `work-session` command globally:

**Option A: Automated**
Run the installer script:
```bash
./install_local.sh
```

**Option B: Manual**
```bash
ln -sf ~/projects/productivity-tracking/superproductivity/sync.sh ~/.local/bin/work-session
```

## Configuration

### Initial Settings
Open Super Productivity and configure:

1. **Settings > General**
   - Enable "Show task timer in tray"

2. **Settings > Pomodoro**
   - Disable strict Pomodoro (use Flowtime instead for flexibility)
   - Or keep enabled if you prefer structure

3. **Settings > Idle Handling**
   - Enable idle detection
   - Set threshold to 5 minutes

4. **Settings > Reminders**
   - Enable break reminders
   - Set interval to 45-60 minutes

5. **Settings > Integrations > GitHub**
   - Add your GitHub token
   - Import issues from client repos

### 3. Project Structure in SP
Create these projects:
- One per active client
- `Admin` - invoicing, emails, contracts
- `Personal` - learning, side projects

### 4. Recommended Tags
- `#quick-win` - easy tasks for low energy
- `#deep-work` - needs focus
- `#blocked` - waiting on others
- `#admin` - non-coding work

## Backup Workflow

### Export Your Data
1. In SP: Settings > Sync > Export All Data
2. Save to: `superproductivity/backup/sp-backup-YYYYMMDD.json`
3. Run: `./superproductivity/sync.sh commit`

### Restore on New Machine
1. Clone this repo
2. Install Super Productivity
3. In SP: Settings > Sync > Import All Data
4. Select your latest backup file

### Sync Script Commands
```bash
./superproductivity/sync.sh status   # Show backup status
./superproductivity/sync.sh backup   # Find SP backups
./superproductivity/sync.sh commit   # Backup and git commit
./superproductivity/sync.sh restore  # List available backups
```

## Files

```
.
├── README.md                     # This file
├── superproductivity/
│   ├── backup/                   # SP data exports (git tracked)
│   └── sync.sh                   # Backup helper script
└── workflows/
    └── adhd-strategies.md        # Personal productivity playbook
```

## Resources

- [Super Productivity Docs](https://super-productivity.com/)
- [GitHub Repo](https://github.com/johannesjo/super-productivity)
- [ADHD Focus Guide](https://super-productivity.com/adhd-focus/)
