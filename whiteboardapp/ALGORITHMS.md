# Whiteboard Algorithms Documentation

This document provides detailed explanations of the algorithms used in the whiteboard application, including mathematical formulas.

## 1. Drawing Algorithms

### 1.1 Bézier Curve Smoothing
[Wikipedia Reference](https://en.wikipedia.org/wiki/B%C3%A9zier_curve)

#### Mathematical Foundation
The quadratic Bézier curve is defined by:

```math
B(t) = (1-t)^2P_0 + 2(1-t)tP_1 + t^2P_2, t ∈ [0,1]
```

where:
- P₀ is the start point
- P₁ is the control point
- P₂ is the end point
- t is the curve parameter

Control points are calculated as:
```math
P_1 = \frac{P_0 + P_2}{2}
```

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L150-L200)

```cpp
void Line::draw(emscripten::val context) {
    if (points.size() < 2) return;
    
    context.call<void>("beginPath");
    context.call<void>("moveTo", points[0].x, points[0].y);
    
    // Apply Bézier curve smoothing
    for (size_t i = 1; i < points.size() - 1; i++) {
        // Calculate control points
        float cpx = (points[i].x + points[i-1].x) / 2;
        float cpy = (points[i].y + points[i-1].y) / 2;
        
        // Quadratic Bézier curve: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
        context.call<void>("quadraticCurveTo",
            cpx, cpy,                    // Control point P₁
            points[i].x, points[i].y     // End point P₂
        );
    }
    
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.call<void>("stroke");
}
```

### 1.2 Rectangle Drawing
[Wikipedia Reference](https://en.wikipedia.org/wiki/Vector_path)

#### Mathematical Foundation
Rectangle defined by four points:
```math
R = {(x_1,y_1), (x_2,y_1), (x_2,y_2), (x_1,y_2)}
```

Border thickness vector calculation:
```math
\vec{n} = \frac{(y_2-y_1, -(x_2-x_1))}{\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}} \cdot thickness
```

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L220-L250)

```cpp
void Rectangle::draw(emscripten::val context) {
    context.call<void>("beginPath");
    
    // Draw rectangle using path commands
    context.call<void>("rect",
        bounds.x, bounds.y,     // Top-left corner
        bounds.width,           // Width
        bounds.height           // Height
    );
    
    // Apply styles
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.call<void>("stroke");
}
```

### 1.3 Circle Drawing
[Wikipedia Reference](https://en.wikipedia.org/wiki/Midpoint_circle_algorithm)

#### Mathematical Foundation
Circle equation:
```math
(x - h)^2 + (y - k)^2 = r^2
```

Arc parametric equations:
```math
x = h + r\cos(\theta)
y = k + r\sin(\theta)
```

where:
- (h,k) is the center
- r is the radius
- θ is the angle

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L280-L310)

```cpp
void Circle::draw(emscripten::val context) {
    context.call<void>("beginPath");
    
    // Draw circle using arc command
    context.call<void>("arc",
        center.x, center.y,     // Center point (h,k)
        radius,                 // Radius r
        0,                      // Start angle
        2 * M_PI,              // End angle (full circle)
        false                   // Counter-clockwise
    );
    
    // Apply styles
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.call<void>("stroke");
}
```

## 2. Selection Algorithms

### 2.1 Hit Detection
[Wikipedia References](https://en.wikipedia.org/wiki/Point_in_polygon)

#### Point-to-Line Distance
```math
d = \frac{|ax_0 + by_0 + c|}{\sqrt{a^2 + b^2}}
```

#### Point-in-Rectangle Test
```math
x_1 ≤ x ≤ x_2 \land y_1 ≤ y ≤ y_2
```

#### Point-to-Circle Distance
```math
d = \sqrt{(x-h)^2 + (y-k)^2} ≤ r
```

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L350-L400)

```cpp
bool Line::containsPoint(float x, float y) {
    const float threshold = thickness / 2 + 5.0f; // Hit detection threshold
    
    for (size_t i = 1; i < points.size(); i++) {
        // Calculate distance from point to line segment
        float x1 = points[i-1].x, y1 = points[i-1].y;
        float x2 = points[i].x, y2 = points[i].y;
        
        // Line equation: ax + by + c = 0
        float a = y2 - y1;
        float b = x1 - x2;
        float c = x2 * y1 - x1 * y2;
        
        // Distance formula: |ax₀ + by₀ + c| / √(a² + b²)
        float distance = std::abs(a*x + b*y + c) / std::sqrt(a*a + b*b);
        
        if (distance <= threshold) return true;
    }
    return false;
}

bool Circle::containsPoint(float x, float y) {
    // Distance formula: √((x-h)² + (y-k)²)
    float dx = x - center.x;
    float dy = y - center.y;
    float distance = std::sqrt(dx*dx + dy*dy);
    
    return distance <= radius + thickness/2;
}

### 2.2 Selection Box
[Wikipedia Reference](https://en.wikipedia.org/wiki/Line_segment_intersection)

#### Rectangle Intersection Test
```math
\max(x_1,x_2) < \min(x_3,x_4) \land \max(y_1,y_2) < \min(y_3,y_4)
```

#### Line Intersection
For lines P₁P₂ and P₃P₄:
```math
t = \frac{(x_1-x_3)(y_3-y_4) - (y_1-y_3)(x_3-x_4)}{(x_1-x_2)(y_3-y_4) - (y_1-y_2)(x_3-x_4)}
```

## 3. Eraser Algorithm

### 3.1 Circular Region Collision
[Wikipedia Reference](https://en.wikipedia.org/wiki/Collision_detection#Circle_collision)

#### Circle-Point Distance Test
```math
d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2} ≤ r
```

#### Path Splitting
For a line segment AB intersecting circle (h,k,r):
```math
(x-h)^2 + (y-k)^2 = r^2
x = x_1 + t(x_2-x_1)
y = y_1 + t(y_2-y_1)
```

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L450-L500)

```cpp
void Whiteboard::erase(float x, float y, float radius) {
    auto it = elements.begin();
    while (it != elements.end()) {
        bool shouldErase = false;
        
        // For each point in the element
        if (auto line = std::dynamic_pointer_cast<Line>(*it)) {
            for (const auto& point : line->points) {
                // Distance formula: √((x₂-x₁)² + (y₂-y₁)²)
                float dx = point.x - x;
                float dy = point.y - y;
                float distance = std::sqrt(dx*dx + dy*dy);
                
                if (distance <= radius) {
                    shouldErase = true;
                    break;
                }
            }
        }
        
        if (shouldErase) {
            it = elements.erase(it);
        } else {
            ++it;
        }
    }
}
```

## 4. Input Smoothing

### 4.1 Exponential Moving Average
[Wikipedia Reference](https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average)

#### Smoothing Formula
```math
S_t = \alpha x_t + (1-\alpha)S_{t-1}
```

where:
- S_t is the smoothed value
- x_t is the current input
- α is the smoothing factor (0 < α < 1)

#### Implementation Location
[View in whiteboard.ts](./src/lib/whiteboard.ts#L180-L220)

```typescript
private smoothInput(x: number, y: number): Point {
    const alpha = 0.7; // Smoothing factor
    
    // First input point
    if (this.lastX === 0 && this.lastY === 0) {
        this.lastX = x;
        this.lastY = y;
        return { x, y };
    }
    
    // Exponential smoothing: St = αxt + (1-α)St-1
    const smoothX = alpha * x + (1 - alpha) * this.lastX;
    const smoothY = alpha * y + (1 - alpha) * this.lastY;
    
    this.lastX = smoothX;
    this.lastY = smoothY;
    
    return { x: smoothX, y: smoothY };
}
```

### 4.2 Coordinate Transformation
```math
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & b & c \\ d & e & f \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
```

## 5. Memory Management

### 5.1 Reference Counting
[Wikipedia Reference](https://en.wikipedia.org/wiki/Reference_counting)

#### Memory Usage Formula
```math
M_{total} = M_{base} + \sum_{i=1}^n M_{element_i}
```

where:
- M_total is total memory usage
- M_base is base memory allocation
- M_element_i is memory for each drawing element

#### Implementation Location
[View in whiteboard.cpp](./src/wasm/whiteboard.cpp#L50-L80)

```cpp
class Whiteboard {
private:
    // Smart pointer management for drawing elements
    std::vector<std::shared_ptr<DrawableElement>> elements;
    
    // Memory-efficient element creation
    template<typename T, typename... Args>
    std::shared_ptr<T> createElement(Args&&... args) {
        auto element = std::make_shared<T>(std::forward<Args>(args)...);
        elements.push_back(element);
        return element;
    }
    
    // Automatic cleanup of deleted elements
    void removeElement(const std::shared_ptr<DrawableElement>& element) {
        auto it = std::find(elements.begin(), elements.end(), element);
        if (it != elements.end()) {
            elements.erase(it);
            // Smart pointer automatically handles memory deallocation
        }
    }
};
```

### 5.2 Memory Pool
[Wikipedia Reference](https://en.wikipedia.org/wiki/Memory_pool)

#### Memory Pool Usage Formula
```math
M_{total} = M_{pool} + \sum_{i=1}^n M_{element_i}
```

where:
- M_total is total memory usage
- M_pool is memory pool allocation
- M_element_i is memory for each drawing element

## 6. Performance Analysis

### 6.1 Time Complexity

- Drawing Operations: O(1) per point
- Selection Operations: O(n) where n is number of elements
- Eraser Operations: O(n) where n is number of elements
- Memory Management: O(1) amortized
- State Updates: O(1) per operation

### 6.2 Space Complexity

- Drawing Elements: O(n) where n is number of elements
- Selection State: O(k) where k is number of selected elements
- Memory Pool: O(m) where m is allocated memory size 