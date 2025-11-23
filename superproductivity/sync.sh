#!/bin/bash

# 1. Define where your "Live Brain" lives
REPO_DIR="$HOME/projects/productivity-tracking"
SYNC_FILE="superproductivity/backup/super-productivity-backup.json"

cd "$REPO_DIR" || exit

function status() {
  echo "🧠 Brain Status:"
  if [[ -n $(git status -s "$SYNC_FILE") ]]; then
    echo "   ⚠️  Unsaved changes in your local brain (Need to commit!)"
  else
    echo "   ✅  Brain is clean and synced with GitHub."
  fi
}

function save() {
  echo "💾 Saving brain state..."

  # 1. Force the app to write to disk by checking if it's running
  if pgrep -x "super-productiv" >/dev/null; then
    echo "   (App is running - assuming auto-save has triggered recently)"
    # Optional: You could kill it here to force a save, but it's aggressive.
  fi

  # 2. Check for file changes
  if [[ -n $(git status -s) ]]; then
    git add .
    # Commit with a timestamp so you know when you worked
    git commit -m "Brain Dump: $(date '+%Y-%m-%d %H:%M')"
    git push origin master
    echo "✅ Pushed to GitHub."
  else
    echo "💤 No new thoughts to save."
  fi
}

function load() {
  echo "📥 Pulling latest brain from GitHub..."
  git pull --rebase --autostash
  echo "✅ Local file updated. Restart Super Productivity to see changes!"
}

# Handle arguments
case "$1" in
status) status ;;
save) save ;;
load) load ;;
*) echo "Usage: ./sync.sh {status|save|load}" ;;
esac
