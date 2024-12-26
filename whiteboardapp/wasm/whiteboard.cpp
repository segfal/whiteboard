#include <vector>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>
#include <sstream>
#include <cmath>

// Define ShapeType enum first
enum class ShapeType {
    FREEHAND,
    RECTANGLE,
    CIRCLE,
    LINE,
    TRIANGLE
};

struct Point {
    float x;
    float y;
};

struct Shape {
    Point start;
    Point end;
    ShapeType type;
    std::string color;
    float thickness;
    bool selected;

    Shape() : selected(false) {}
};

struct Line {
    std::vector<Point> points;
    std::string color;
    float thickness;
    bool selected;

    Line() : selected(false) {}
};

class Whiteboard {
private:
    std::vector<Line> lines;
    std::vector<Shape> shapes;
    std::string currentColor;
    float currentThickness;
    Point selectionStart;
    Point selectionEnd;
    bool isSelecting;
    bool isDrawingShape;
    ShapeType currentShape;
    Shape* currentShapePtr;

public:
    Whiteboard() : currentColor("#000000"), currentThickness(2.0f), 
                  isSelecting(false), isDrawingShape(false),
                  currentShape(ShapeType::FREEHAND), currentShapePtr(nullptr) {
        init();
    }

    void init() {
        lines.clear();
        shapes.clear();
        isSelecting = false;
        isDrawingShape = false;
        currentShapePtr = nullptr;
    }

    void startDrawing(float x, float y) {
        if (currentShape == ShapeType::FREEHAND) {
            Line newLine;
            newLine.color = currentColor;
            newLine.thickness = currentThickness;
            newLine.points.push_back({x, y});
            lines.push_back(newLine);
        } else {
            Shape newShape;
            newShape.type = currentShape;
            newShape.color = currentColor;
            newShape.thickness = currentThickness;
            newShape.selected = false;

            // Set initial size and position based on shape type
            float width = 0;
            float height = 0;

            switch (currentShape) {
                case ShapeType::RECTANGLE:
                    width = 100;  // Default width
                    height = 100; // Default height
                    break;
                case ShapeType::CIRCLE:
                    width = 80;   // Default diameter
                    height = 80;  // Default diameter
                    break;
                default:
                    width = 100;
                    height = 100;
                    break;
            }

            // Center the shape at the click point
            newShape.start = {x - width/2, y - height/2};
            newShape.end = {x + width/2, y + height/2};
            shapes.push_back(newShape);
            currentShapePtr = &shapes.back();
        }
    }

    void continueDrawing(float x, float y) {
        if (currentShape == ShapeType::FREEHAND && !lines.empty()) {
            lines.back().points.push_back({x, y});
        }
        // Ignore continue events for shapes during creation
    }

    void endDrawing() {
        isDrawingShape = false;
        currentShapePtr = nullptr;
    }

    void startSelection(float x, float y) {
        isSelecting = true;
        selectionStart = {x, y};
        selectionEnd = {x, y};
    }

    void updateSelection(float x, float y) {
        if (isSelecting) {
            selectionEnd = {x, y};
            float left = std::min(selectionStart.x, selectionEnd.x);
            float right = std::max(selectionStart.x, selectionEnd.x);
            float top = std::min(selectionStart.y, selectionEnd.y);
            float bottom = std::max(selectionStart.y, selectionEnd.y);

            // Check lines
            for (auto& line : lines) {
                line.selected = false;
                for (const auto& point : line.points) {
                    if (point.x >= left && point.x <= right &&
                        point.y >= top && point.y <= bottom) {
                        line.selected = true;
                        break;
                    }
                }
            }

            // Check shapes
            for (auto& shape : shapes) {
                shape.selected = false;
                float shapeLeft = std::min(shape.start.x, shape.end.x);
                float shapeRight = std::max(shape.start.x, shape.end.x);
                float shapeTop = std::min(shape.start.y, shape.end.y);
                float shapeBottom = std::max(shape.start.y, shape.end.y);

                if (shapeLeft >= left && shapeRight <= right &&
                    shapeTop >= top && shapeBottom <= bottom) {
                    shape.selected = true;
                }
            }
        }
    }

    void endSelection() {
        isSelecting = false;
    }

    void clearSelection() {
        for (auto& line : lines) {
            line.selected = false;
        }
        for (auto& shape : shapes) {
            shape.selected = false;
        }
        isSelecting = false;
    }

    void moveSelected(float dx, float dy) {
        // Move lines
        for (auto& line : lines) {
            if (line.selected) {
                for (auto& point : line.points) {
                    point.x += dx;
                    point.y += dy;
                }
            }
        }

        // Move shapes
        for (auto& shape : shapes) {
            if (shape.selected) {
                shape.start.x += dx;
                shape.start.y += dy;
                shape.end.x += dx;
                shape.end.y += dy;
            }
        }
    }

    void deleteSelected() {
        // Delete selected lines
        auto lineIt = lines.begin();
        while (lineIt != lines.end()) {
            if (lineIt->selected) {
                lineIt = lines.erase(lineIt);
            } else {
                ++lineIt;
            }
        }

        // Delete selected shapes
        auto shapeIt = shapes.begin();
        while (shapeIt != shapes.end()) {
            if (shapeIt->selected) {
                shapeIt = shapes.erase(shapeIt);
            } else {
                ++shapeIt;
            }
        }
    }

    void setColor(const std::string& color) {
        currentColor = color;
        // If we're currently drawing a shape, update its color
        if (isDrawingShape && currentShapePtr) {
            currentShapePtr->color = color;
        }
    }

    void setThickness(float thickness) {
        currentThickness = thickness;
    }

    void setShapeType(ShapeType shape) {
        currentShape = shape;
    }

    void draw(emscripten::val context) {
        // Draw freehand lines
        for (const auto& line : lines) {
            if (line.points.empty()) continue;

            context.call<void>("beginPath");
            context.set("strokeStyle", line.color);
            context.set("lineWidth", line.thickness);
            context.set("lineCap", std::string("round"));
            context.set("lineJoin", std::string("round"));

            context.call<void>("moveTo", line.points[0].x, line.points[0].y);
            for (size_t i = 1; i < line.points.size(); i++) {
                context.call<void>("lineTo", line.points[i].x, line.points[i].y);
            }
            context.call<void>("stroke");

            if (line.selected) {
                context.set("strokeStyle", "#0095ff");
                context.set("lineWidth", line.thickness + 2);
                context.call<void>("stroke");
            }
        }

        // Draw shapes
        for (const auto& shape : shapes) {
            context.call<void>("beginPath");
            context.set("strokeStyle", shape.color);
            context.set("lineWidth", shape.thickness);

            float width = shape.end.x - shape.start.x;
            float height = shape.end.y - shape.start.y;

            if (shape.type == ShapeType::RECTANGLE) {
                context.call<void>("rect", 
                    shape.start.x, shape.start.y,
                    width, height);
                context.call<void>("stroke");
            } else if (shape.type == ShapeType::CIRCLE) {
                float centerX = shape.start.x + width / 2;
                float centerY = shape.start.y + height / 2;
                float radius = std::min(std::abs(width), std::abs(height)) / 2;
                
                context.call<void>("beginPath");
                context.call<void>("arc", centerX, centerY, radius, 0, 2 * M_PI);
                context.call<void>("stroke");
            }

            if (shape.selected) {
                context.set("strokeStyle", "#0095ff");
                context.set("lineWidth", shape.thickness + 2);
                context.call<void>("stroke");
            }
        }

        // Draw selection rectangle
        if (isSelecting) {
            context.call<void>("beginPath");
            context.set("strokeStyle", "#0095ff");
            context.set("lineWidth", 1);
            context.call<void>("setLineDash", emscripten::val::array(std::vector<int>{5, 5}));
            context.call<void>("strokeRect",
                std::min(selectionStart.x, selectionEnd.x),
                std::min(selectionStart.y, selectionEnd.y),
                std::abs(selectionEnd.x - selectionStart.x),
                std::abs(selectionEnd.y - selectionStart.y));
            context.call<void>("setLineDash", emscripten::val::array(std::vector<int>{}));
        }
    }

    void clear() {
        lines.clear();
        shapes.clear();
    }

    void erase(float x, float y, float radius) {
        // Erase lines
        for (auto it = lines.begin(); it != lines.end();) {
            bool pointsRemoved = false;
            auto& points = it->points;
            
            for (auto pointIt = points.begin(); pointIt != points.end();) {
                float dx = x - pointIt->x;
                float dy = y - pointIt->y;
                float distance = std::sqrt(dx * dx + dy * dy);
                
                if (distance < radius) {
                    pointIt = points.erase(pointIt);
                    pointsRemoved = true;
                } else {
                    ++pointIt;
                }
            }
            
            if (points.empty() && pointsRemoved) {
                it = lines.erase(it);
            } else {
                ++it;
            }
        }

        // Erase shapes
        for (auto it = shapes.begin(); it != shapes.end();) {
            float centerX = (it->start.x + it->end.x) / 2;
            float centerY = (it->start.y + it->end.y) / 2;
            float dx = x - centerX;
            float dy = y - centerY;
            float distance = std::sqrt(dx * dx + dy * dy);

            if (distance < radius) {
                it = shapes.erase(it);
            } else {
                ++it;
            }
        }
    }

    /**
     * @brief Convert the current drawing to SVG paths
     * @return String containing SVG path elements
     */
    std::string getSVGPaths() {
        std::stringstream svg;
        
        // Convert lines to SVG paths
        for (const auto& line : lines) {
            if (line.points.empty()) continue;
            
            svg << "<path d=\"M " << line.points[0].x << " " << line.points[0].y;
            for (size_t i = 1; i < line.points.size(); i++) {
                svg << " L " << line.points[i].x << " " << line.points[i].y;
            }
            svg << "\" stroke=\"" << line.color << "\" stroke-width=\"" << line.thickness 
                << "\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>";
        }
        
        // Convert shapes to SVG elements
        for (const auto& shape : shapes) {
            float width = shape.end.x - shape.start.x;
            float height = shape.end.y - shape.start.y;
            
            if (shape.type == ShapeType::RECTANGLE) {
                svg << "<rect x=\"" << shape.start.x << "\" y=\"" << shape.start.y 
                    << "\" width=\"" << width << "\" height=\"" << height 
                    << "\" stroke=\"" << shape.color << "\" stroke-width=\"" << shape.thickness 
                    << "\" fill=\"none\"/>";
            } else if (shape.type == ShapeType::CIRCLE) {
                float centerX = shape.start.x + width / 2;
                float centerY = shape.start.y + height / 2;
                float radius = std::min(std::abs(width), std::abs(height)) / 2;
                
                svg << "<circle cx=\"" << centerX << "\" cy=\"" << centerY 
                    << "\" r=\"" << radius << "\" stroke=\"" << shape.color 
                    << "\" stroke-width=\"" << shape.thickness << "\" fill=\"none\"/>";
            }
        }
        
        return svg.str();
    }
};

// Binding code for Emscripten
EMSCRIPTEN_BINDINGS(whiteboard_module) {
    emscripten::enum_<ShapeType>("ShapeType")
        .value("FREEHAND", ShapeType::FREEHAND)
        .value("RECTANGLE", ShapeType::RECTANGLE)
        .value("CIRCLE", ShapeType::CIRCLE)
        .value("LINE", ShapeType::LINE)
        .value("TRIANGLE", ShapeType::TRIANGLE);

    emscripten::class_<Whiteboard>("Whiteboard")
        .constructor()
        .function("init", &Whiteboard::init)
        .function("startDrawing", &Whiteboard::startDrawing)
        .function("continueDrawing", &Whiteboard::continueDrawing)
        .function("endDrawing", &Whiteboard::endDrawing)
        .function("startSelection", &Whiteboard::startSelection)
        .function("updateSelection", &Whiteboard::updateSelection)
        .function("endSelection", &Whiteboard::endSelection)
        .function("clearSelection", &Whiteboard::clearSelection)
        .function("moveSelected", &Whiteboard::moveSelected)
        .function("deleteSelected", &Whiteboard::deleteSelected)
        .function("setColor", &Whiteboard::setColor)
        .function("setThickness", &Whiteboard::setThickness)
        .function("setShapeType", &Whiteboard::setShapeType)
        .function("draw", &Whiteboard::draw)
        .function("clear", &Whiteboard::clear)
        .function("erase", &Whiteboard::erase)
        .function("getSVGPaths", &Whiteboard::getSVGPaths);
}
