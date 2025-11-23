#!/bin/bash
# Super Productivity Backup/Sync Script
# For git-based version control of SP configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backup"
SP_CONFIG_DIR="$HOME/.config/superProductivity"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

usage() {
    cat << EOF
Super Productivity Git Sync

Usage: $0 <command>

Commands:
    status      Show backup status and last sync time
    backup      Copy current SP auto-backups to git repo
    commit      Backup and commit changes
    restore     List available backups for restore
    open-sp     Open Super Productivity config directory

Workflow:
    1. In Super Productivity: Settings > Sync > File Sync
       Set sync folder to: $BACKUP_DIR

    2. Or use built-in export:
       Settings > Sync > Export All Data
       Save to: $BACKUP_DIR/sp-export-YYYYMMDD.json

    3. Run: $0 commit
       This will stage and commit your backup files

EOF
}

status() {
    echo "=== Super Productivity Backup Status ==="
    echo ""
    echo "Backup directory: $BACKUP_DIR"
    echo "SP config dir: $SP_CONFIG_DIR"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        echo "Backups in repo:"
        ls -lht "$BACKUP_DIR"/*.json 2>/dev/null || echo "  No JSON exports found"
        echo ""
    fi

    echo "Last git commit:"
    git -C "$SCRIPT_DIR/.." log -1 --oneline 2>/dev/null || echo "  No commits yet"
}

backup() {
    echo "=== Looking for SP auto-backups ==="

    # SP stores auto-backups in its config directory
    if [ -d "$SP_CONFIG_DIR" ]; then
        # Look for any JSON backup files SP may have created
        find "$SP_CONFIG_DIR" -name "*.json" -mtime -7 2>/dev/null | head -5
    fi

    echo ""
    echo "To create a fresh backup:"
    echo "  1. Open Super Productivity"
    echo "  2. Go to Settings (gear icon) > Sync"
    echo "  3. Click 'Export All Data'"
    echo "  4. Save as: $BACKUP_DIR/sp-backup-$TIMESTAMP.json"
}

commit() {
    cd "$SCRIPT_DIR/.."

    if [ -z "$(git status --porcelain)" ]; then
        echo "No changes to commit"
        exit 0
    fi

    git add -A
    echo ""
    echo "Changes to commit:"
    git status --short
    echo ""

    read -p "Commit message [Backup SP data $TIMESTAMP]: " msg
    msg=${msg:-"Backup SP data $TIMESTAMP"}

    git commit -m "$msg"
    echo ""
    echo "Committed! Run 'git push' when ready."
}

restore() {
    echo "=== Available Backups ==="
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        ls -lht "$BACKUP_DIR"/*.json 2>/dev/null || echo "No backups found"
    fi

    echo ""
    echo "To restore:"
    echo "  1. Open Super Productivity"
    echo "  2. Go to Settings > Sync"
    echo "  3. Click 'Import All Data'"
    echo "  4. Select your backup file"
}

open_sp() {
    if command -v xdg-open &> /dev/null; then
        xdg-open "$SP_CONFIG_DIR"
    else
        echo "Config directory: $SP_CONFIG_DIR"
    fi
}

case "${1:-}" in
    status)  status ;;
    backup)  backup ;;
    commit)  commit ;;
    restore) restore ;;
    open-sp) open_sp ;;
    *)       usage ;;
esac
