#!/bin/bash
# Super Productivity Git Sync
# Live sync workflow for git-tracked SP data

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_FILE="superproductivity/backup/super-productivity-backup.json"

cd "$REPO_DIR" || exit 1

status() {
    echo "=== Brain Status ==="
    if [[ -n $(git status -s "$SYNC_FILE") ]]; then
        echo "Unsaved changes detected (run './sync.sh save' to commit)"
        echo ""
        git diff --stat "$SYNC_FILE" 2>/dev/null || true
    else
        echo "Clean - synced with remote"
    fi
    echo ""
    echo "Last commit:"
    git log -1 --oneline
}

save() {
    echo "=== Saving to git ==="

    # Check if app is running
    if pgrep -f "superproductivity" > /dev/null; then
        echo "(SP is running - auto-save should have triggered)"
    fi

    # Check for changes
    if [[ -n $(git status -s) ]]; then
        git add -A
        git commit -m "Sync: $(date '+%Y-%m-%d %H:%M')"
        git push
        echo "Pushed to remote."
    else
        echo "No changes to save."
    fi
}

load() {
    echo "=== Pulling latest from git ==="
    git pull --rebase --autostash
    echo "Done. Restart Super Productivity to see changes."
}

case "${1:-}" in
    status) status ;;
    save)   save ;;
    load)   load ;;
    *)
        cat << EOF
Super Productivity Git Sync

Usage: ./sync.sh {status|save|load}

Commands:
    status    Check if local changes need saving
    save      Commit and push changes to git
    load      Pull latest from git (run before starting work)

IMPORTANT: You must configure SP first!
  1. Open Super Productivity
  2. Settings > Sync & Export
  3. Enable Syncing, select "LocalFile"
  4. Set path to: $REPO_DIR/$SYNC_FILE

Daily workflow:
  Morning:  ./sync.sh load
  Work:     (SP auto-saves to the JSON file)
  Evening:  ./sync.sh save
EOF
        ;;
esac
