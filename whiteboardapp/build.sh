#!/bin/bash

# build.sh
#
# Build script for the WebAssembly whiteboard application.
# This script:
# 1. Creates necessary directories
# 2. Configures CMake with Emscripten
# 3. Builds the WebAssembly module
# 4. Copies output files to the Next.js public directory

# Exit on any error
set -e

echo "Building WebAssembly Whiteboard Application..."

# Create build directory if it doesn't exist
echo "Creating build directory..."
mkdir -p build
cd build

# Configure CMake with Emscripten
echo "Configuring CMake..."
emcmake cmake ..

# Build the project
echo "Building WebAssembly module..."
emmake make

# Create public/wasm directory if it doesn't exist
echo "Creating public/wasm directory..."
mkdir -p ../public/wasm

# Copy WebAssembly files to public directory
echo "Copying build output to public directory..."
cp dist/whiteboard.js ../public/wasm/
cp dist/whiteboard.wasm ../public/wasm/

echo "Build complete! Files are located in public/wasm/"
echo "- whiteboard.js"
echo "- whiteboard.wasm"

# Return to original directory
cd ..

echo "You can now start the Next.js development server with: npm run dev" 