#!/bin/bash

# ==============================================================================
# Productivity Sync CLI
# ==============================================================================

# Configuration
REPO_DIR="$HOME/projects/productivity-tracking"
SYNC_FILE="superproductivity/backup/super-productivity-backup.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Navigate to project directory
if ! cd "$REPO_DIR"; then
  echo -e "${RED}❌ Error: Could not change directory to $REPO_DIR${RESET}"
  exit 1
fi

# Helper functions for logging
log_info() { echo -e "${BLUE}ℹ️  $1${RESET}"; }
log_success() { echo -e "${GREEN}✅ $1${RESET}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${RESET}"; }
log_error() { echo -e "${RED}❌ $1${RESET}"; }

# ------------------------------------------------------------------------------
# Core Functions
# ------------------------------------------------------------------------------

function show_status() {
  echo -e "${BOLD}🧠 Checking Brain Status...${RESET}"
  # Check the entire repo status, not just the specific sync file
  if [[ -n $(git status -s) ]]; then
    log_warn "Unsaved changes detected in your local brain."
    git status -s
    echo -e "   👉 You need to ${BOLD}save${RESET} (commit) your changes."
  else
    log_success "Brain is clean and synced with GitHub."
  fi
}

function save_brain() {
  echo -e "${BOLD}💾 Saving Brain State...${RESET}"

  # 1. Check if app is running
  if pgrep -x "super-productiv" >/dev/null; then
    log_info "Super Productivity app is running."
    echo "   (Assuming auto-save has triggered recently)"
  fi

  # 2. Check for file changes
  if [[ -n $(git status -s) ]]; then
    log_info "Changes detected. preparing to commit..."
    git add .

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M')

    if git commit -m "Brain Dump: $timestamp"; then
      log_info "Pushing to origin/master..."
      if git push origin master; then
        log_success "Successfully pushed to GitHub!"

        # 3. Sync to Google Calendar
        echo -e "${BOLD}📅 Syncing to Google Calendar...${RESET}"
        if (cd "$REPO_DIR/sp-to-gcal" && npm run sync); then
          log_success "Calendar sync complete."
        else
          log_warn "Calendar sync failed (check logs)."
        fi
      else
        log_error "Failed to push to GitHub."
        exit 1
      fi
    else
      log_error "Commit failed."
      exit 1
    fi
  else
    log_success "No new thoughts to save (working directory clean)."
  fi
}

function load_brain() {
  echo -e "${BOLD}📥 Loading Brain from GitHub...${RESET}"
  log_info "Pulling changes..."

  if git pull --rebase --autostash; then
    log_success "Local brain updated."
    echo -e "${CYAN}💡 Reminder: Restart Super Productivity to see the changes!${RESET}"
  else
    log_error "Failed to pull changes."
    exit 1
  fi
}

function print_usage() {
  echo -e "${BOLD}Usage: $0 [command]${RESET}"
  echo ""
  echo "Commands:"
  echo -e "  ${CYAN}status${RESET}   Check if there are local changes to sync"
  echo -e "  ${CYAN}save${RESET}     Commit and push local changes to GitHub"
  echo -e "  ${CYAN}load${RESET}     Pull latest changes from GitHub"
  echo -e "  ${CYAN}-h, --help${RESET} Show this help message"
  echo ""
  echo "If no command is provided, an interactive menu will be shown."
}

function start_session() {
  # 1. Pull latest data
  load_brain

  # 2. Launch the App (detached so it doesn't close with the terminal)
  echo -e "${BOLD}🚀 Launching Super Productivity...${RESET}"
  # Fire and Forget: Instruct Hyprland to spawn the process directly.
  # This makes it a child of the compositor, not this shell.
  hyprctl dispatch exec superproductivity > /dev/null 2>&1
}

function show_menu() {
  echo -e "${CYAN}=========================================${RESET}"
  echo -e "${BOLD}      🧠 Productivity Brain Sync 🧠      ${RESET}"
  echo -e "${CYAN}=========================================${RESET}"
  echo "What would you like to do?"
  echo ""

  options=("Check Status" "Save (Push)" "Load (Pull)" "Quit")
  PS3="> Select an option (1-4): "

  select opt in "${options[@]}"; do
    case $opt in
    "Check Status")
      show_status
      break
      ;;
    "Save (Push)")
      save_brain
      break
      ;;
    "Load (Pull)")
      load_brain
      break
      ;;
    "Quit")
      log_info "Goodbye! 👋"
      exit 0
      ;;
    *)
      log_error "Invalid option $REPLY"
      ;;
    esac
  done
}

# ------------------------------------------------------------------------------
# Main Logic
# ------------------------------------------------------------------------------

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

# Check if an argument is provided
if [[ -n "$1" ]]; then
  case "$1" in
  status) show_status ;;
  save) save_brain ;;
  load) load_brain ;;
  start) start_session ;;
  *)
    log_error "Unknown command: $1"
    print_usage
    exit 1
    ;;
  esac
else
  # No arguments, run interactive menu
  show_menu
fi

