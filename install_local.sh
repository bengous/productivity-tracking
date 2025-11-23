#!/bin/bash

# Target directory for user binaries
BIN_DIR="$HOME/.local/bin"

# Check if ~/.local/bin exists
if [ ! -d "$BIN_DIR" ]; then
    echo "Directory $BIN_DIR does not exist. Creating it..."
    mkdir -p "$BIN_DIR"
fi

# Create the symlink
# We use $PWD to ensure absolute path based on current location
ln -sf "$PWD/superproductivity/sync.sh" "$BIN_DIR/work-session"

# Ensure the target script is executable
chmod +x "$PWD/superproductivity/sync.sh"

echo "✅ Work Session tool installed to $BIN_DIR/work-session"
