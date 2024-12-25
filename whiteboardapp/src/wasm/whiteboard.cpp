#include "../../include/wasm/whiteboard.hpp"

// Line implementation
void Line::draw(emscripten::val context) {
    if (points.empty()) return;

    context.call<void>("beginPath");
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.set("lineCap", std::string("round"));
    context.set("lineJoin", std::string("round"));

    context.call<void>("moveTo", points[0].x, points[0].y);
    for (size_t i = 1; i < points.size(); i++) {
        context.call<void>("lineTo", points[i].x, points[i].y);
    }
    context.call<void>("stroke");

    // Draw selection outline if selected
    if (selected) {
        Rect bounds = getBounds();
        context.set("strokeStyle", "#0095ff");
        context.set("lineWidth", 2);
        context.call<void>("strokeRect", bounds.x - 5, bounds.y - 5, 
                          bounds.width + 10, bounds.height + 10);
    }
}

bool Line::containsPoint(float x, float y) {
    for (size_t i = 1; i < points.size(); i++) {
        float x1 = points[i-1].x, y1 = points[i-1].y;
        float x2 = points[i].x, y2 = points[i].y;
        
        float distance = std::abs((y2-y1)*x - (x2-x1)*y + x2*y1 - y2*x1) /
                        std::sqrt((y2-y1)*(y2-y1) + (x2-x1)*(x2-x1));
        
        if (distance < 5.0f) return true;
    }
    return false;
}

void Line::move(float dx, float dy) {
    for (auto& point : points) {
        point.x += dx;
        point.y += dy;
    }
}

Rect Line::getBounds() {
    if (points.empty()) return {0, 0, 0, 0};
    
    float minX = points[0].x, maxX = points[0].x;
    float minY = points[0].y, maxY = points[0].y;
    
    for (const auto& point : points) {
        minX = std::min(minX, point.x);
        maxX = std::max(maxX, point.x);
        minY = std::min(minY, point.y);
        maxY = std::max(maxY, point.y);
    }
    
    return {minX, minY, maxX - minX, maxY - minY};
}

// Rectangle implementation
void Rectangle::draw(emscripten::val context) {
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.call<void>("strokeRect", bounds.x, bounds.y, bounds.width, bounds.height);

    if (selected) {
        context.set("strokeStyle", "#0095ff");
        context.set("lineWidth", 2);
        context.call<void>("strokeRect", bounds.x - 5, bounds.y - 5, 
                          bounds.width + 10, bounds.height + 10);
    }
}

bool Rectangle::containsPoint(float x, float y) {
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
}

void Rectangle::move(float dx, float dy) {
    bounds.x += dx;
    bounds.y += dy;
}

// Circle implementation
void Circle::draw(emscripten::val context) {
    context.call<void>("beginPath");
    context.set("strokeStyle", color);
    context.set("lineWidth", thickness);
    context.call<void>("arc", center.x, center.y, radius, 0, 2 * M_PI);
    context.call<void>("stroke");

    if (selected) {
        context.set("strokeStyle", "#0095ff");
        context.set("lineWidth", 2);
        Rect bounds = getBounds();
        context.call<void>("strokeRect", bounds.x - 5, bounds.y - 5, 
                          bounds.width + 10, bounds.height + 10);
    }
}

bool Circle::containsPoint(float x, float y) {
    float dx = x - center.x;
    float dy = y - center.y;
    return (dx * dx + dy * dy) <= (radius * radius);
}

void Circle::move(float dx, float dy) {
    center.x += dx;
    center.y += dy;
}

Rect Circle::getBounds() {
    return {center.x - radius, center.y - radius, radius * 2, radius * 2};
}

// Whiteboard implementation
Whiteboard::Whiteboard() 
    : currentColor("#000000"), currentThickness(2.0f), 
      currentShape(ShapeType::FREEHAND), isSelecting(false) {
    init();
}

void Whiteboard::init() {
    elements.clear();
    selectedElements.clear();
    currentElement = nullptr;
    isSelecting = false;
}

void Whiteboard::startDrawing(float x, float y) {
    if (isSelecting) {
        startSelection(x, y);
        return;
    }

    switch (currentShape) {
        case ShapeType::FREEHAND: {
            auto line = std::make_shared<Line>();
            line->points.push_back({x, y});
            line->color = currentColor;
            line->thickness = currentThickness;
            currentElement = line;
            break;
        }
        case ShapeType::RECTANGLE: {
            auto rect = std::make_shared<Rectangle>();
            rect->bounds = {x, y, 0, 0};
            rect->color = currentColor;
            rect->thickness = currentThickness;
            currentElement = rect;
            break;
        }
        case ShapeType::CIRCLE: {
            auto circle = std::make_shared<Circle>();
            circle->center = {x, y};
            circle->radius = 0;
            circle->color = currentColor;
            circle->thickness = currentThickness;
            currentElement = circle;
            break;
        }
        default:
            break;
    }

    if (currentElement) {
        elements.push_back(currentElement);
    }
}

void Whiteboard::continueDrawing(float x, float y) {
    if (isSelecting) {
        updateSelection(x, y);
        return;
    }

    if (!currentElement) return;

    switch (currentShape) {
        case ShapeType::FREEHAND: {
            auto line = std::static_pointer_cast<Line>(currentElement);
            line->points.push_back({x, y});
            break;
        }
        case ShapeType::RECTANGLE: {
            auto rect = std::static_pointer_cast<Rectangle>(currentElement);
            float dx = x - rect->bounds.x;
            float dy = y - rect->bounds.y;
            rect->bounds.width = dx;
            rect->bounds.height = dy;
            break;
        }
        case ShapeType::CIRCLE: {
            auto circle = std::static_pointer_cast<Circle>(currentElement);
            float dx = x - circle->center.x;
            float dy = y - circle->center.y;
            circle->radius = std::sqrt(dx * dx + dy * dy);
            break;
        }
        default:
            break;
    }
}

void Whiteboard::endDrawing() {
    if (isSelecting) {
        endSelection();
        return;
    }

    currentElement = nullptr;
}

void Whiteboard::draw(emscripten::val context) {
    for (const auto& element : elements) {
        element->draw(context);
    }
}

void Whiteboard::setShapeType(ShapeType type) {
    currentShape = type;
    clearSelection();
}

void Whiteboard::setColor(const std::string& color) {
    currentColor = color;
}

void Whiteboard::setThickness(float thickness) {
    currentThickness = thickness;
}

void Whiteboard::startSelection(float x, float y) {
    selectionStart = {x, y};
    clearSelection();
}

void Whiteboard::updateSelection(float x, float y) {
    float left = std::min(x, selectionStart.x);
    float top = std::min(y, selectionStart.y);
    float right = std::max(x, selectionStart.x);
    float bottom = std::max(y, selectionStart.y);

    for (auto& element : elements) {
        Rect bounds = element->getBounds();
        bool intersects = !(bounds.x > right || 
                          bounds.x + bounds.width < left ||
                          bounds.y > bottom || 
                          bounds.y + bounds.height < top);
        element->selected = intersects;
        if (intersects) {
            selectedElements.push_back(element);
        }
    }
}

void Whiteboard::endSelection() {
    isSelecting = false;
}

void Whiteboard::moveSelected(float dx, float dy) {
    for (auto& element : selectedElements) {
        element->move(dx, dy);
    }
}

void Whiteboard::deleteSelected() {
    elements.erase(
        std::remove_if(elements.begin(), elements.end(),
            [](const auto& element) { return element->selected; }),
        elements.end()
    );
    selectedElements.clear();
}

void Whiteboard::clearSelection() {
    for (auto& element : elements) {
        element->selected = false;
    }
    selectedElements.clear();
}

void Whiteboard::clear() {
    init();
}

void Whiteboard::erase(float x, float y, float radius) {
    elements.erase(
        std::remove_if(elements.begin(), elements.end(),
            [x, y, radius](const auto& element) {
                return element->containsPoint(x, y);
            }),
        elements.end()
    );
}

// Binding code for Emscripten
EMSCRIPTEN_BINDINGS(whiteboard_module) {
    emscripten::enum_<ShapeType>("ShapeType")
        .value("FREEHAND", ShapeType::FREEHAND)
        .value("RECTANGLE", ShapeType::RECTANGLE)
        .value("CIRCLE", ShapeType::CIRCLE)
        .value("LINE", ShapeType::LINE)
        .value("TRIANGLE", ShapeType::TRIANGLE);

    emscripten::class_<Whiteboard>("Whiteboard")
        .constructor<>()
        .function("init", &Whiteboard::init)
        .function("startDrawing", &Whiteboard::startDrawing)
        .function("continueDrawing", &Whiteboard::continueDrawing)
        .function("endDrawing", &Whiteboard::endDrawing)
        .function("setShapeType", &Whiteboard::setShapeType)
        .function("setColor", &Whiteboard::setColor)
        .function("setThickness", &Whiteboard::setThickness)
        .function("draw", &Whiteboard::draw)
        .function("clear", &Whiteboard::clear)
        .function("erase", &Whiteboard::erase)
        .function("startSelection", &Whiteboard::startSelection)
        .function("updateSelection", &Whiteboard::updateSelection)
        .function("endSelection", &Whiteboard::endSelection)
        .function("moveSelected", &Whiteboard::moveSelected)
        .function("deleteSelected", &Whiteboard::deleteSelected)
        .function("clearSelection", &Whiteboard::clearSelection);
} 