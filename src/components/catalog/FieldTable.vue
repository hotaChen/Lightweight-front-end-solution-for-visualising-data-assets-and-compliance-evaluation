<template>
  <div class="field-card">
    <!-- 等级筛选 chips -->
    <div class="chip-bar">
      <span class="chip-label">按等级筛选：</span>
      <button :class="['chip', { 'chip--active': active === 'all' }]" @click="active = 'all'">
        全部 <span class="chip-count">{{ fields.length }}</span>
      </button>
      <button
        v-for="l in LEVELS"
        :key="l"
        :class="['chip', { 'chip--active': active === l }]"
        @click="active = l"
      >
        <span class="chip-dot" :style="{ background: SENSITIVITY_META[l].color }" v-if="SENSITIVITY_META[l]" />
        {{ l }}
        <span class="chip-count">{{ counts[l] }}</span>
      </button>
    </div>

    <!-- Table -->
    <table class="field-table">
      <thead>
        <tr>
          <th class="pl-4">字段名</th>
          <th>字段描述</th>
          <th>数据类型</th>
          <th>分类</th>
          <th>等级</th>
          <th>依据法规</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in rows" :key="f.name" :class="{ 'row-high': f.level === '核心' || f.level === '敏感' }">
          <td class="pl-4">
            <span :class="['field-name', { 'field-name--high': f.level === '核心' || f.level === '敏感' }]">{{ f.name }}</span>
          </td>
          <td class="text-muted">{{ f.desc }}</td>
          <td class="font-mono text-muted" style="font-size: 0.75rem;">{{ f.type }}</td>
          <td>{{ f.category }}</td>
          <td><Badges badge-type="level" :level="f.level" /></td>
          <td class="text-muted">{{ f.regulation }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Badges from '@/components/Badges.vue'
import { SENSITIVITY_META, type FieldInfo, type SensitivityLevel } from '@/data'

const props = defineProps<{ fields: FieldInfo[] }>()

const LEVELS: SensitivityLevel[] = ['核心', '敏感', '内部', '公开']
const active = ref<SensitivityLevel | 'all'>('all')

const counts = computed(() => {
  const c: Record<string, number> = {}
  LEVELS.forEach(l => c[l] = props.fields.filter(f => f.level === l).length)
  return c
})

const rows = computed(() => active.value === 'all' ? props.fields : props.fields.filter(f => f.level === active.value))
</script>

<style scoped>
.field-card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  overflow: hidden;
}
.chip-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
}
.chip-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--border);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
  transition: all 0.15s;
}
.chip:hover { background: var(--muted); }
.chip--active { border-color: var(--primary); background: color-mix(in oklab, var(--primary) 10%, transparent); color: var(--primary); }
.chip-dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; }
.chip-count { opacity: 0.6; font-variant-numeric: tabular-nums; }

.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.field-table th {
  height: 2.5rem;
  padding: 0 0.75rem;
  text-align: left;
  font-weight: 500;
  color: var(--muted-foreground);
  white-space: nowrap;
}
.field-table thead tr {
  background: color-mix(in oklab, var(--muted) 40%, transparent);
}
.field-table tbody tr {
  border-bottom: 1px solid var(--border);
}
.field-table tbody tr:last-child {
  border-bottom: none;
}
.field-table td {
  padding: 0.75rem;
  vertical-align: middle;
}
.pl-4 { padding-left: 1rem; }
.text-muted { color: var(--muted-foreground); }
.font-mono { font-family: var(--font-mono); }
.field-name { font-family: var(--font-mono); font-size: 0.875rem; }
.field-name--high { font-weight: 600; }
.row-high { background: color-mix(in oklab, var(--chart-1) 4%, transparent); }
</style>
