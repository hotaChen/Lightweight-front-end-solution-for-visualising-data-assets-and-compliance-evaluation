<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="stat-card"
    :class="{ 'stat-card--interactive': interactive }"
    :type="interactive ? 'button' : undefined"
    @click="interactive && emit('click')"
  >
    <div class="stat-body">
      <div class="stat-icon" :style="{ background: `color-mix(in oklab, ${accent} 14%, transparent)`, color: accent }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="iconType === 'check'" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <template v-else-if="iconType === 'alert'">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </template>
          <template v-else>
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </template>
        </svg>
      </div>
      <div>
        <p class="stat-label">{{ label }}</p>
        <p class="stat-value">{{ value }}</p>
        <p class="stat-desc">{{ desc }}</p>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
defineProps<{
  iconType: 'check' | 'alert' | 'clock'
  accent: string
  label: string
  value: number
  desc: string
  interactive?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.stat-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--card-foreground);
}
.stat-card--interactive { width: 100%; text-align: left; cursor: pointer; }
.stat-card--interactive:hover { border-color: var(--primary); background: color-mix(in oklab, var(--primary) 4%, var(--card)); }
.stat-card--interactive:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.stat-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 1rem;
}
.stat-icon {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  flex-shrink: 0;
}
.stat-label {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}
.stat-desc {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
</style>
