/**
 * @file ExportManager.ts
 * @brief Export management system using the Factory pattern
 */

export interface ExportStrategy {
    export(canvas: HTMLCanvasElement, isDarkMode: boolean): void;
}

class PNGExporter implements ExportStrategy {
    export(canvas: HTMLCanvasElement, isDarkMode: boolean): void {
        // Create a temporary canvas to include background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return;
        
        // Fill background
        tempCtx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the original canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }
}

class SVGExporter implements ExportStrategy {
    constructor(private getSVGContent: () => string) {}

    export(canvas: HTMLCanvasElement, isDarkMode: boolean): void {
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', canvas.width.toString());
        svg.setAttribute('height', canvas.height.toString());
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add background rectangle
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', isDarkMode ? '#1a1a1a' : '#ffffff');
        svg.appendChild(background);
        
        // Get SVG content from the whiteboard
        const svgContent = this.getSVGContent();
        if (svgContent) {
            svg.innerHTML += svgContent;
        }
        
        // Create download link
        const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'whiteboard.svg';
        link.href = URL.createObjectURL(svgBlob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

export class ExportManager {
    private exporters: Map<string, ExportStrategy>;

    constructor(getSVGContent: () => string) {
        this.exporters = new Map([
            ['png', new PNGExporter()],
            ['svg', new SVGExporter(getSVGContent)]
        ]);
    }

    export(format: string, canvas: HTMLCanvasElement, isDarkMode: boolean): void {
        const exporter = this.exporters.get(format.toLowerCase());
        if (exporter) {
            exporter.export(canvas, isDarkMode);
        } else {
            throw new Error(`Unsupported export format: ${format}`);
        }
    }

    addExporter(format: string, exporter: ExportStrategy): void {
        this.exporters.set(format.toLowerCase(), exporter);
    }

    removeExporter(format: string): void {
        this.exporters.delete(format.toLowerCase());
    }
} 