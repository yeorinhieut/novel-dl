#!/bin/bash

# This script packages the extension directory into extension.zip for distribution.

# Navigate to the script's directory to ensure correct paths
cd "$(dirname "$0")"

# Define source and output
EXTENSION_DIR="./extension"
ZIP_FILE="./extension.zip"

# Check if the extension directory exists
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "Error: Extension directory '$EXTENSION_DIR' not found."
    exit 1
fi

# Remove the old zip file if it exists
if [ -f "$ZIP_FILE" ]; then
    echo "Removing old '$ZIP_FILE'..."
    rm "$ZIP_FILE"
fi

# Create the new zip file
echo "Creating '$ZIP_FILE' from '$EXTENSION_DIR'..."
(cd "$EXTENSION_DIR" && zip -r ../"$ZIP_FILE" ./*)

echo "Done. '$ZIP_FILE' has been created successfully." 