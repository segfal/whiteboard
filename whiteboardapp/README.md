# WebAssembly Whiteboard Application

A real-time drawing whiteboard application that combines the performance of C++ (compiled to WebAssembly) with the modern web interface capabilities of Next.js and TypeScript.

## Overview

This application demonstrates how to build a high-performance drawing application by:
1. Implementing core drawing logic in C++
2. Compiling it to WebAssembly for browser execution
3. Creating a TypeScript wrapper for the WebAssembly module
4. Building a modern UI with Next.js and React

## Features

- Drawing Tools:
  - Freehand drawing with adjustable thickness
  - Shape tools (Rectangle, Circle)
  - Color picker for stroke colors
  - Eraser tool
- Selection Tools:
  - Select and move drawn elements
  - Delete selected elements
  - Multi-select support
- Touch Support:
  - Works on mobile devices
  - Responsive design
  - Multi-touch gestures

## Project Structure Explained

```
whiteboardapp/
├── src/                      # Source code directory
│   ├── wasm/                # WebAssembly C++ implementation
│   │   └── whiteboard.cpp   # Core drawing logic in C++
│   ├��─ lib/                 # TypeScript libraries
│   │   └── whiteboard.ts    # TypeScript wrapper for WASM
│   ├── components/          # React components
│   │   └── Whiteboard.tsx   # Main whiteboard component
│   └── app/                 # Next.js app directory
│       └── page.tsx         # Main page component
├── include/                 # C++ header files
│   └── wasm/
│       └── whiteboard.hpp   # C++ class definitions
├── public/                  # Public assets
│   └── wasm/               # Compiled WebAssembly files
├── CMakeLists.txt          # CMake build configuration
├── build.sh                # Build script for WASM
└── next.config.js          # Next.js configuration
```

## Technology Stack Explained

### 1. WebAssembly (C++) Layer
- Location: `src/wasm/` and `include/wasm/`
- Purpose: High-performance drawing operations
- Key Files:
  - `whiteboard.hpp`: Defines the class structure and interfaces
  - `whiteboard.cpp`: Implements the drawing logic
- Features:
  - Shape rendering
  - Selection handling
  - State management

### 2. TypeScript Wrapper Layer
- Location: `src/lib/`
- Purpose: Bridge between WebAssembly and React
- Key Files:
  - `whiteboard.ts`: Provides TypeScript interface to WASM
- Features:
  - Event handling
  - Canvas management
  - Type safety

### 3. React/Next.js Layer
- Location: `src/components/` and `src/app/`
- Purpose: User interface and interactions
- Key Files:
  - `Whiteboard.tsx`: Main React component
  - `page.tsx`: Next.js page component
- Features:
  - Tool selection
  - Color/thickness controls
  - Responsive layout

## Setup and Installation

### Prerequisites
1. Install Emscripten SDK (emsdk):
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. Install Node.js (v16 or higher):
   ```bash
   # Using nvm (recommended)
   nvm install 16
   nvm use 16
   ```

3. Install CMake (v3.10 or higher):
   ```bash
   # macOS
   brew install cmake

   # Ubuntu
   sudo apt-get install cmake
   ```

### Building the Project

1. Install Node.js dependencies:
   ```bash
   cd whiteboardapp
   npm install
   ```

2. Build the WebAssembly module:
   ```bash
   bash build.sh
   ```
   This script:
   - Configures CMake for Emscripten
   - Compiles C++ to WebAssembly
   - Copies built files to public directory

3. Start the development server:
   ```bash
   npm run dev
   ```

## Implementation Details

### C++ Core (WebAssembly)
The C++ implementation provides:
- Class hierarchy for different shapes
- Selection and transformation logic
- Efficient drawing algorithms

Key concepts:
```cpp
class DrawableElement {
    // Base class for all drawable elements
    virtual void draw(emscripten::val context) = 0;
    virtual bool containsPoint(float x, float y) = 0;
    virtual void move(float dx, float dy) = 0;
};
```

### TypeScript Wrapper
The wrapper manages:
- WebAssembly module loading
- Canvas interaction
- Event handling

Key concepts:
```typescript
export class WhiteboardWrapper {
    // Manages WebAssembly interaction and canvas state
    private module: WhiteboardModule | null = null;
    private whiteboard: Whiteboard | null = null;
    // ... event handlers and drawing logic
}
```

### React Component
The React component handles:
- User interface
- Tool selection
- State management

Key concepts:
```typescript
export default function Whiteboard() {
    // Manages UI state and tool selection
    const [currentTool, setCurrentTool] = useState<'draw' | 'select' | 'erase'>('draw');
    const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.FREEHAND);
    // ... UI rendering and event handling
}
```

## Algorithms and Technical Implementation

For detailed mathematical formulas and algorithm explanations, see [ALGORITHMS.md](./ALGORITHMS.md).

### 1. Drawing Algorithms
Located in `src/wasm/whiteboard.cpp`:

#### Freehand Drawing
- **Algorithm**: [Bézier Curve Smoothing](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)
- **Location**: `Line::draw` method
- **Purpose**: Smooths freehand drawing using quadratic Bézier curves
- **Core Formula**: $B(t) = (1-t)^2P_0 + 2(1-t)tP_1 + t^2P_2$
- **Time Complexity**: $O(n)$ where $n$ is number of points
- See [ALGORITHMS.md](./ALGORITHMS.md#11-bézier-curve-smoothing) for detailed implementation

#### Shape Drawing
Located in `src/wasm/whiteboard.cpp`:

##### Rectangle Drawing
- **Algorithm**: [Path Drawing](https://en.wikipedia.org/wiki/Vector_path)
- **Location**: `Rectangle::draw` method
- **Core Formula**: Rectangle $R = \{(x_1,y_1), (x_2,y_1), (x_2,y_2), (x_1,y_2)\}$
- **Time Complexity**: $O(1)$
- See [ALGORITHMS.md](./ALGORITHMS.md#12-rectangle-drawing) for detailed implementation

##### Circle Drawing
- **Algorithm**: [Midpoint Circle Algorithm](https://en.wikipedia.org/wiki/Midpoint_circle_algorithm)
- **Location**: `Circle::draw` method
- **Core Formula**: $(x - h)^2 + (y - k)^2 = r^2$
- **Time Complexity**: $O(1)$
- See [ALGORITHMS.md](./ALGORITHMS.md#13-circle-drawing) for detailed implementation

### 2. Selection Algorithms
Located in `src/wasm/whiteboard.cpp`:

#### Hit Detection
- **Algorithm**: [Point-in-Shape Testing](https://en.wikipedia.org/wiki/Point_in_polygon)
- **Location**: `DrawableElement::containsPoint` methods
- **Core Formulas**:
  - Line: $d = \frac{|ax_0 + by_0 + c|}{\sqrt{a^2 + b^2}}$
  - Circle: $d = \sqrt{(x-h)^2 + (y-k)^2} \leq r$
- See [ALGORITHMS.md](./ALGORITHMS.md#21-hit-detection) for detailed implementation

### 3. Eraser Algorithm
Located in `src/wasm/whiteboard.cpp`:

- **Algorithm**: [Circular Region Collision](https://en.wikipedia.org/wiki/Collision_detection#Circle_collision)
- **Location**: `Whiteboard::erase` method
- **Core Formula**: $d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2} \leq r$
- See [ALGORITHMS.md](./ALGORITHMS.md#3-eraser-algorithm) for detailed implementation

### 4. Input Smoothing
Located in `src/lib/whiteboard.ts`:

- **Algorithm**: [Exponential Moving Average](https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average)
- **Location**: `WhiteboardWrapper` event handlers
- **Core Formula**: $S_t = \alpha x_t + (1-\alpha)S_{t-1}$
- See [ALGORITHMS.md](./ALGORITHMS.md#4-input-smoothing) for detailed implementation

### 5. Memory Management
Located in `src/wasm/whiteboard.cpp`:

- **Algorithm**: [Smart Pointer Management](https://en.wikipedia.org/wiki/Smart_pointer)
- **Location**: Throughout C++ implementation
- **Memory Formula**: $M_{total} = M_{base} + \sum_{i=1}^n M_{element_i}$
- See [ALGORITHMS.md](./ALGORITHMS.md#5-memory-management) for detailed implementation

### Performance Characteristics

#### Time Complexity
- Drawing: $O(1)$ per point
- Selection: $O(n)$ where $n$ is number of elements
- Eraser: $O(n)$ where $n$ is number of elements
- Memory: $O(1)$ amortized
- State Updates: $O(1)$ per operation

#### Space Complexity
- Drawing Elements: $O(n)$
- Selection State: $O(k)$
- Memory Pool: $O(m)$

For complete mathematical derivations and detailed algorithm explanations, please refer to [ALGORITHMS.md](./ALGORITHMS.md).

## Build System Explained

### CMake Configuration
- Purpose: Configure C++ compilation to WebAssembly
- Key flags:
  - `WASM=1`: Enable WebAssembly output
  - `MODULARIZE=1`: Create modular JS wrapper
  - `EXPORT_ES6=1`: Enable ES6 module support

### Next.js Configuration
- Purpose: Configure webpack for WebAssembly
- Key settings:
  - WebAssembly loading support
  - Module resolution
  - MIME type handling

## Usage Guide

1. Drawing:
   - Select 'Draw' tool
   - Choose shape type (Freehand, Rectangle, Circle)
   - Set color and thickness
   - Draw on canvas

2. Selection:
   - Select 'Select' tool
   - Click and drag to select elements
   - Move selected elements
   - Delete with Delete button

3. Eraser:
   - Select 'Erase' tool
   - Click and drag to erase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

Common issues and solutions:
1. WebAssembly compilation errors:
   - Ensure Emscripten is properly installed
   - Check CMake configuration
   - Verify C++ compiler compatibility

2. Next.js integration issues:
   - Check WebAssembly file paths
   - Verify webpack configuration
   - Check browser console for errors

## License

MIT License - See LICENSE file for details
