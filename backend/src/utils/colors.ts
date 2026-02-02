/**
 * Simple hash function to generate a consistent number from a string.
 */
function getHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

/**
 * Generates a consistent HSL color based on a string (e.g., source name).
 * Optimized for readability/vibrancy.
 */
export function generateSourceColor(name: string): string {
    const hash = getHash(name);
    // Use HSL to ensure good saturation and lightness
    const hue = Math.abs(hash % 360);
    // Saturation between 60% and 80%
    const saturation = 70 + (Math.abs(hash % 60) / 6);
    // Lightness between 45% and 55% for dark/light mode balance
    const lightness = 50 + (Math.abs(hash % 20) / 4) - 5;

    return `hsl(${hue}, ${Math.floor(saturation)}%, ${Math.floor(lightness)}%)`;
}
