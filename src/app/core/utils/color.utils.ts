/** Converts a hex colour to rgba with the given opacity */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Returns the CSS custom property string to set the habit card background */
export function habitCardStyle(color: string, completed: boolean): Record<string, string> {
  return completed
    ? { 'background-color': hexToRgba(color, 0.15) }
    : { 'background-color': 'var(--card-default)' };
}
