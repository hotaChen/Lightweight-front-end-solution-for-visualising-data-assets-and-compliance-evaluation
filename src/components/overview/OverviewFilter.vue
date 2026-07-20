<template>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">业务域</span>
      <div class="chip-row">
        <button
          v-for="d in BUSINESS_DOMAINS"
          :key="d"
          type="button"
          :class="['chip', { 'chip--active': modelValue.domains.includes(d) }]"
          @click="toggleDomain(d)"
        >
          {{ d }}
        </button>
      </div>
    </div>

    <span class="filter-divider" />

    <div class="filter-group">
      <span class="filter-label">敏感等级</span>
      <div class="chip-row">
        <button
          v-for="lv in LEVELS"
          :key="lv"
          type="button"
          :class="['chip', 'chip--level', { 'chip--active': modelValue.levels.includes(lv) }]"
          :style="chipStyle(lv)"
          @click="toggleLevel(lv)"
        >
          <span class="chip-dot" :style="{ background: SENSITIVITY_META[lv].color }" />
          {{ lv }}
        </button>
      </div>
    </div>

    <div class="filter-actions">
      <span v-if="active" class="filter-count">已选 {{ selectedCount }} 项 · 命中 {{ matchCount }} 张表</span>
      <button v-if="active" type="button" class="reset-btn" @click="reset">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.36 2.64L3 8"/><path d="M3 3v5h5"/></svg>
        重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BUSINESS_DOMAINS,
  SENSITIVITY_META,
  filterTables,
  isFilterActive,
  emptyFilter,
  type BusinessDomain,
  type SensitivityLevel,
  type OverviewFilter,
} from '@/data'

const props = defineProps<{ modelValue: OverviewFilter }>()
const emit = defineEmits<{ 'update:modelValue': [OverviewFilter] }>()

const LEVELS: SensitivityLevel[] = ['核心', '敏感', '内部', '公开']

const active = computed(() => isFilterActive(props.modelValue))
const selectedCount = computed(() => props.modelValue.domains.length + props.modelValue.levels.length)
const matchCount = computed(() => filterTables(props.modelValue).length)

function chipStyle(lv: SensitivityLevel) {
  if (!props.modelValue.levels.includes(lv)) return {}
  return {
    borderColor: `color-mix(in oklab, ${SENSITIVITY_META[lv].color} 45%, transparent)`,
    background: `color-mix(in oklab, ${SENSITIVITY_META[lv].color} 12%, transparent)`,
    color: SENSITIVITY_META[lv].color,
  }
}

function toggleDomain(d: BusinessDomain) {
  const domains = props.modelValue.domains.includes(d)
    ? props.modelValue.domains.filter((x) => x !== d)
    : [...props.modelValue.domains, d]
  emit('update:modelValue', { ...props.modelValue, domains })
}

function toggleLevel(lv: SensitivityLevel) {
  const levels = props.modelValue.levels.includes(lv)
    ? props.modelValue.levels.filter((x) => x !== lv)
    : [...props.modelValue.levels, lv]
  emit('update:modelValue', { ...props.modelValue, levels })
}

function reset() {
  emit('update:modelValue', emptyFilter())
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}
.filter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
  white-space: nowrap;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.625rem;
  font-size: 0.75rem;
  line-height: 1.4;
  border-radius: 9999px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.chip:hover {
  border-color: color-mix(in oklab, var(--primary) 45%, transparent);
  color: var(--foreground);
}
.chip--active {
  border-color: color-mix(in oklab, var(--primary) 55%, transparent);
  background: color-mix(in oklab, var(--primary) 12%, transparent);
  color: var(--primary);
  font-weight: 500;
}
.chip-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  flex-shrink: 0;
}
.filter-divider {
  width: 1px;
  height: 1.25rem;
  background: var(--border);
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}
.filter-count {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}
.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.15s;
}
.reset-btn:hover {
  color: var(--foreground);
  border-color: var(--primary);
}
</style>
