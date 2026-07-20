<template>
  <div class="meta-item">
    <div class="meta-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <template v-if="icon === 'layers'">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </template>
        <template v-else-if="icon === 'file'">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
        </template>
        <template v-else-if="icon === 'database'">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </template>
        <template v-else-if="icon === 'user'">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </template>
        <template v-else>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </template>
      </svg>
    </div>
    <div class="meta-text">
      <p class="meta-label">{{ label }}</p>
      <p class="meta-value">{{ value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: 'layers' | 'file' | 'database' | 'user' | 'calendar'
  label: string
  value: string
}>()
</script>

<style scoped>
.meta-item {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}
.meta-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--accent);
  color: var(--accent-foreground);
  flex-shrink: 0;
}
.meta-label { font-size: 0.75rem; color: var(--muted-foreground); }
.meta-value { font-size: 0.875rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
