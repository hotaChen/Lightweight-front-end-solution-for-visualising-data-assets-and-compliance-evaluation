<template>
  <div class="stat-card">
    <div class="stat-body">
      <div class="stat-info">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-value-row">
          <span class="stat-value">{{ value }}</span>
          <span v-if="unit" class="stat-unit">{{ unit }}</span>
        </div>
        <span v-if="delta" class="stat-delta">{{ delta }}</span>
      </div>
      <div class="stat-icon" :style="iconStyle">
        <slot name="icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  delta?: string
  accent?: string
}>()

const iconStyle = computed(() => ({
  background: `color-mix(in oklab, ${props.accent ?? 'var(--primary)'} 14%, transparent)`,
  color: props.accent ?? 'var(--primary)',
}))
</script>

<style scoped>
.stat-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--card-foreground);
}
.stat-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stat-label {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}
.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}
.stat-unit {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}
.stat-delta {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  flex-shrink: 0;
}
</style>
