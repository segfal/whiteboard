/**
 * @file whiteboard.hpp
 * @brief Core drawing functionality for the WebAssembly whiteboard application
 * 
 * This file contains the class definitions for the whiteboard's drawing system.
 * The implementation is designed to be compiled to WebAssembly and used from JavaScript/TypeScript.
 * 
 * The architecture follows a component-based design where each drawable element
 * (shapes, lines, etc.) inherits from a common base class.
 */

#pragma once

#include <vector>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>
#include <cmath>
#include <memory>

/**
 * @brief Represents a 2D point in the drawing canvas
 * 
 * Used as a basic building block for all drawing operations.
 * Coordinates are in canvas pixel space.
 */
struct Point {
    float x;  ///< X coordinate in pixels from the left edge
    float y;  ///< Y coordinate in pixels from the top edge
};

/**
 * @brief Represents a rectangular boundary
 * 
 * Used for:
 * - Shape boundaries
 * - Selection areas
 * - Hit testing
 * - Clipping regions
 */
struct Rect {
    float x;      ///< Left edge X coordinate
    float y;      ///< Top edge Y coordinate
    float width;  ///< Width of rectangle
    float height; ///< Height of rectangle
};

/**
 * @brief Available shape types for drawing
 * 
 * Each shape type represents a different drawing tool that the user can select.
 * The enum values match the TypeScript ShapeType enum for consistency.
 */
enum class ShapeType {
    FREEHAND,   ///< Freehand drawing tool
    RECTANGLE,  ///< Rectangle shape tool
    CIRCLE,     ///< Circle shape tool
    LINE,       ///< Straight line tool
    TRIANGLE    ///< Triangle shape tool (prepared for future use)
};

/**
 * @brief Base class for all drawable elements
 * 
 * This abstract class defines the interface that all drawable elements must implement.
 * It provides virtual methods for:
 * - Drawing
 * - Hit testing
 * - Movement
 * - Bounds calculation
 */
class DrawableElement {
public:
    virtual ~DrawableElement() = default;

    /**
     * @brief Draw the element to the canvas context
     * @param context JavaScript canvas 2D context passed from TypeScript
     */
    virtual void draw(emscripten::val context) = 0;

    /**
     * @brief Test if a point is within/near the element
     * @param x X coordinate to test
     * @param y Y coordinate to test
     * @return true if point is contained/near the element
     */
    virtual bool containsPoint(float x, float y) = 0;

    /**
     * @brief Move the element by a relative offset
     * @param dx X offset in pixels
     * @param dy Y offset in pixels
     */
    virtual void move(float dx, float dy) = 0;

    /**
     * @brief Get the bounding rectangle of the element
     * @return Rect struct containing the element's bounds
     */
    virtual Rect getBounds() = 0;

    std::string color;     ///< Element color in HTML format (e.g., "#000000")
    float thickness;       ///< Line thickness in pixels
    bool selected = false; ///< Selection state for move/delete operations
};

/**
 * @brief Represents a freehand drawn line
 * 
 * Stores a series of points that make up a freehand drawing.
 * Points are connected with line segments to create a smooth curve.
 */
class Line : public DrawableElement {
public:
    std::vector<Point> points; ///< Series of points making up the line
    void draw(emscripten::val context) override;
    bool containsPoint(float x, float y) override;
    void move(float dx, float dy) override;
    Rect getBounds() override;
};

/**
 * @brief Represents a rectangle shape
 * 
 * Stores a rectangle's position and size.
 * The rectangle can be drawn with different colors and line thicknesses.
 */
class Rectangle : public DrawableElement {
public:
    Rect bounds; ///< Rectangle's position and size
    void draw(emscripten::val context) override;
    bool containsPoint(float x, float y) override;
    void move(float dx, float dy) override;
    Rect getBounds() override { return bounds; }
};

/**
 * @brief Represents a circle shape
 * 
 * Stores a circle's center point and radius.
 * The circle can be drawn with different colors and line thicknesses.
 */
class Circle : public DrawableElement {
public:
    Point center; ///< Center point of the circle
    float radius; ///< Radius of the circle in pixels
    void draw(emscripten::val context) override;
    bool containsPoint(float x, float y) override;
    void move(float dx, float dy) override;
    Rect getBounds() override;
};

/**
 * @brief Main whiteboard class that manages all drawing operations
 * 
 * This class is the primary interface between the C++ code and JavaScript/TypeScript.
 * It manages:
 * - Drawing state (current color, thickness, shape type)
 * - Element collection (storing all drawn elements)
 * - Selection state (selected elements, selection box)
 * - Drawing operations (start, continue, end drawing)
 * - Selection operations (select, move, delete)
 */
class Whiteboard {
private:
    std::vector<std::shared_ptr<DrawableElement>> elements;    ///< All drawn elements
    std::string currentColor;                                  ///< Current drawing color
    float currentThickness;                                    ///< Current line thickness
    ShapeType currentShape;                                    ///< Current shape tool
    std::shared_ptr<DrawableElement> currentElement;           ///< Element being drawn
    std::vector<std::shared_ptr<DrawableElement>> selectedElements; ///< Selected elements
    bool isSelecting;                                         ///< Selection mode flag
    Point selectionStart;                                     ///< Selection box start point

public:
    /**
     * @brief Initialize whiteboard with default settings
     * 
     * Default settings:
     * - Black color (#000000)
     * - 2.0 pixel thickness
     * - Freehand drawing mode
     * - Selection mode off
     */
    Whiteboard();

    /**
     * @brief Reset whiteboard to initial state
     * 
     * Clears all:
     * - Drawn elements
     * - Selected elements
     * - Current drawing
     * - Selection state
     */
    void init();

    // Drawing operations
    void startDrawing(float x, float y);    ///< Start a new drawing operation
    void continueDrawing(float x, float y); ///< Continue current drawing
    void endDrawing();                      ///< End current drawing
    void draw(emscripten::val context);     ///< Draw all elements

    // Shape management
    void setShapeType(ShapeType type);           ///< Set current shape tool
    void setColor(const std::string& color);     ///< Set current color
    void setThickness(float thickness);          ///< Set current line thickness

    // Selection tools
    void startSelection(float x, float y);    ///< Start selection box
    void updateSelection(float x, float y);   ///< Update selection box
    void endSelection();                      ///< End selection operation
    void moveSelected(float dx, float dy);    ///< Move selected elements
    void deleteSelected();                    ///< Delete selected elements
    void clearSelection();                    ///< Clear selection state

    // Canvas management
    void clear();                            ///< Clear entire canvas
    void erase(float x, float y, float radius); ///< Erase at point
}; 