<template>
  <div :class="['chart-card']">
    <div class="chart-header">
      <div>
        <h3 class="chart-title">{{ title }}</h3>
        <p v-if="desc" class="chart-desc">{{ desc }}</p>
      </div>
      <slot name="action" />
    </div>
    <div class="chart-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>()
</script>

<style scoped>
.chart-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--card-foreground);
  display: flex;
  flex-direction: column;
}
.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.25rem 1.25rem 0.5rem;
}
.chart-title {
  font-size: 1rem;
  font-weight: 600;
}
.chart-desc {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-top: 0.125rem;
}
.chart-body {
  padding: 0.5rem 1.25rem 1.25rem;
  flex: 1;
}
</style>
