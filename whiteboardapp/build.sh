#!/bin/bash

# Exit on any error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Building WebAssembly Whiteboard Application..."

# Verify source files exist
if [ ! -f "wasm/whiteboard.cpp" ]; then
    echo "Error: whiteboard.cpp not found in wasm directory"
    exit 1
fi

# Clean previous build artifacts
rm -rf build
rm -rf public/wasm
mkdir -p public/wasm

# Create build directory
echo "Creating build directory..."
mkdir -p build
cd build

# Configure CMake with Emscripten
echo "Configuring CMake..."
emcmake cmake ..

# Build the project
echo "Building WebAssembly module..."
emmake make VERBOSE=1

# Go back to project root
cd ..

# Verify the output files exist
if [ -f "public/wasm/whiteboard.js" ] && [ -f "public/wasm/whiteboard.wasm" ]; then
    echo "Build successful!"
    echo "Output files:"
    echo "- public/wasm/whiteboard.js"
    echo "- public/wasm/whiteboard.wasm"
else
    echo "Error: Build files were not generated correctly"
    exit 1
fi

echo "You can now start the Next.js development server with: npm run dev" 