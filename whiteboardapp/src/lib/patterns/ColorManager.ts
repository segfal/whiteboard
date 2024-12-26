/**
 * @file ColorManager.ts
 * @brief Color management system using the State pattern
 */

export interface ColorState {
    getColor(): string;
    toggleDarkMode(): void;
    setCustomColor(color: string): void;
}

class DefaultColorState implements ColorState {
    constructor(private isDark: boolean, private manager: ColorManager) {}

    getColor(): string {
        return this.isDark ? '#FFFFFF' : '#000000';
    }

    toggleDarkMode(): void {
        this.isDark = !this.isDark;
        this.manager.updateColor(this.getColor());
    }

    setCustomColor(color: string): void {
        this.manager.setState(new CustomColorState(color, this.manager));
    }
}

class CustomColorState implements ColorState {
    constructor(private color: string, private manager: ColorManager) {}

    getColor(): string {
        return this.color;
    }

    toggleDarkMode(): void {
        // Custom colors don't change with dark mode
    }

    setCustomColor(color: string): void {
        this.color = color;
        this.manager.updateColor(color);
    }
}

export class ColorManager {
    private state: ColorState;
    private onColorChange: (color: string) => void;

    constructor(isDarkMode: boolean, onColorChange: (color: string) => void) {
        this.state = new DefaultColorState(isDarkMode, this);
        this.onColorChange = onColorChange;
    }

    setState(state: ColorState): void {
        this.state = state;
    }

    getColor(): string {
        return this.state.getColor();
    }

    toggleDarkMode(): void {
        this.state.toggleDarkMode();
    }

    setColor(color: string): void {
        this.state.setCustomColor(color);
    }

    updateColor(color: string): void {
        this.onColorChange(color);
    }

    isDefaultColor(): boolean {
        return this.state instanceof DefaultColorState;
    }
} 