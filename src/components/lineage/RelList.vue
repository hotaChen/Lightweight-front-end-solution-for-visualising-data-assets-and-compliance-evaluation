<template>
  <div class="rel-list">
    <span class="rel-title">{{ title }}</span>
    <span v-if="tables.length === 0" class="rel-empty">{{ empty }}</span>
    <button
      v-for="t in tables"
      :key="t.id"
      class="rel-item"
      @click="$emit('select', t.id)"
    >
      <span class="rel-name">{{ t.cnName }}</span>
      <span class="rel-level-text" :style="{ color: levelColor(t.level) }">{{ t.level }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DataTable, SensitivityLevel } from '@/data'

defineProps<{
  title: string
  tables: DataTable[]
  empty: string
}>()

defineEmits<{ select: [id: string] }>()

function levelColor(level: SensitivityLevel): string {
  const colors: Record<SensitivityLevel, string> = {
    '核心': 'var(--chart-1)',
    '敏感': 'var(--chart-2)',
    '内部': 'var(--chart-4)',
    '公开': 'var(--muted-foreground)',
  }
  return colors[level]
}
</script>

<style scoped>
.rel-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.rel-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
}
.rel-empty {
  border-radius: var(--radius);
  border: 1px dashed var(--border);
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.rel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  color: inherit;
}
.rel-item:hover {
  border-color: var(--primary);
  background: var(--accent);
}
.rel-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rel-level-text {
  font-size: 0.625rem;
  flex-shrink: 0;
}
</style>
