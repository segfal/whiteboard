# CMakeLists.txt
#
# Build configuration for the WebAssembly whiteboard application.
# This file configures the build system to:
# 1. Compile C++ code to WebAssembly using Emscripten
# 2. Set up necessary compiler flags and options
# 3. Configure output paths and file names
# 4. Enable required features (e.g., WebAssembly, ES6 modules)

# Minimum CMake version required
cmake_minimum_required(VERSION 3.10)

# Project name and language
project(WhiteboardApp)

# Verify we're using Emscripten
if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "This project must be compiled with Emscripten. Please use emcmake cmake.")
endif()

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configure Emscripten output
set(CMAKE_EXECUTABLE_SUFFIX ".js")  # Output .js file alongside .wasm

# Emscripten compiler and linker flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
    -s WASM=1 \                     # Enable WebAssembly output
    -s MODULARIZE=1 \               # Create modular JavaScript wrapper
    -s EXPORT_ES6=1 \               # Enable ES6 module support
    -s EXPORT_NAME=createModule \    # Module factory function name
    -s ALLOW_MEMORY_GROWTH=1 \      # Allow dynamic memory allocation
    -s ASSERTIONS=1 \               # Enable runtime checks (development)
    -s SAFE_HEAP=1 \                # Enable memory access checks
    -s ERROR_ON_UNDEFINED_SYMBOLS=1  # Fail on undefined symbols
")

# Memory configuration
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
    -s INITIAL_MEMORY=16777216 \    # Initial heap (16MB)
    -s MAXIMUM_MEMORY=2147483648 \  # Maximum heap (2GB)
    -s STACK_SIZE=65536            # Stack size (64KB)
")

# Binding configuration
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
    -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \ # Export C functions
    -s EXPORTED_FUNCTIONS=['_malloc','_free']       # Export memory management
")

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)  # Header files

# Source files
set(SOURCES
    src/wasm/whiteboard.cpp  # Main implementation file
)

# Create executable target
add_executable(whiteboard ${SOURCES})

# Set output directory
set_target_properties(whiteboard PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/dist
) 