// Resolve CSS custom property to its computed value at runtime.
// ECharts / G6 render on Canvas and cannot parse var(--xxx) strings.
// Accepts both '--chart-1' and 'var(--chart-1)' formats.
export function cssVar(name: string): string {
  const clean = name.startsWith('var(') ? name.slice(4, -1) : name
  const value = getComputedStyle(document.documentElement).getPropertyValue(clean).trim()
  return value || fallback(clean)
}

function fallback(name: string): string {
  const map: Record<string, string> = {
    '--chart-1': '#ef4444',
    '--chart-2': '#f97316',
    '--chart-3': '#6366f1',
    '--chart-4': '#22c55e',
    '--chart-5': '#06b6d4',
    '--background': '#ffffff',
    '--foreground': '#0f172a',
    '--card': '#ffffff',
    '--muted': '#f1f5f9',
    '--muted-foreground': '#64748b',
    '--border': '#e2e8f0',
    '--primary': '#3b82f6',
    '--accent': '#f1f5f9',
    '--secondary': '#f1f5f9',
  }
  return map[name] || '#888888'
}
