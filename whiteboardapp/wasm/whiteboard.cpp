#include <vector>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>
#include <sstream>

struct Point {
    float x;
    float y;
};

struct Line {
    std::vector<Point> points;
    std::string color;
    float thickness;
};

class Whiteboard {
private:
    std::vector<Line> lines;
    std::string currentColor;
    float currentThickness;

public:
    Whiteboard() : currentColor("#000000"), currentThickness(2.0f) {
        init();
    }

    void init() {
        lines.clear();
    }

    void startLine(float x, float y) {
        Line newLine;
        newLine.color = currentColor;
        newLine.thickness = currentThickness;
        newLine.points.push_back({x, y});
        lines.push_back(newLine);
    }

    void addPoint(float x, float y) {
        if (!lines.empty()) {
            lines.back().points.push_back({x, y});
        }
    }

    void setColor(const std::string& color) {
        currentColor = color;
    }

    void setThickness(float thickness) {
        currentThickness = thickness;
    }

    void draw(emscripten::val context) {
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
        }
    }

    void clear() {
        lines.clear();
    }

    void erase(float x, float y, float radius) {
        // Implementation of eraser tool
        // Remove or modify points that are within the radius of (x,y)
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
    }
};

// Binding code for Emscripten
EMSCRIPTEN_BINDINGS(whiteboard_module) {
    emscripten::class_<Whiteboard>("Whiteboard")
        .constructor()
        .function("init", &Whiteboard::init)
        .function("startLine", &Whiteboard::startLine)
        .function("addPoint", &Whiteboard::addPoint)
        .function("setColor", &Whiteboard::setColor)
        .function("setThickness", &Whiteboard::setThickness)
        .function("draw", &Whiteboard::draw)
        .function("clear", &Whiteboard::clear)
        .function("erase", &Whiteboard::erase);
}
