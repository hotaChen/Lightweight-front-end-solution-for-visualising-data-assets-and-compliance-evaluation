<template>
  <div class="view-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.value"
      :class="['view-tab', { 'view-tab--active': modelValue === tab.value }]"
      @click="$emit('update:modelValue', tab.value)"
    >
      <span>{{ tab.label }}</span>
      <span v-if="tab.count !== undefined" class="view-tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface ViewTab {
  value: string
  label: string
  count?: number
}

withDefaults(defineProps<{
  modelValue: string
  tabs: ViewTab[]
  ariaLabel?: string
}>(), {
  ariaLabel: '页面视图',
})

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.view-tabs {
  display: inline-flex;
  align-self: flex-start;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--muted) 55%, transparent);
}
.view-tab {
  min-height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0 0.875rem;
  border-radius: calc(var(--radius) - 2px);
  color: var(--muted-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}
.view-tab:hover { color: var(--foreground); }
.view-tab--active {
  background: var(--background);
  color: var(--foreground);
  box-shadow: 0 1px 2px color-mix(in oklab, var(--foreground) 10%, transparent);
}
.view-tab-count {
  min-width: 1.25rem;
  padding: 0.05rem 0.35rem;
  border-radius: 9999px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}
.view-tab--active .view-tab-count {
  background: color-mix(in oklab, var(--primary) 12%, transparent);
  color: var(--primary);
}
@media (max-width: 480px) {
  .view-tabs { width: 100%; }
  .view-tab { flex: 1; min-width: 0; padding: 0 0.5rem; }
}
</style>
