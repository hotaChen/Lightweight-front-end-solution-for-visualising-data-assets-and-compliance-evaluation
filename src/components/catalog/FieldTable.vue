<template>
  <div class="field-card">
    <!-- 等级筛选 chips -->
    <div class="chip-bar">
      <label class="field-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input v-model="query" type="search" placeholder="搜索字段名或描述" />
      </label>
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

    <div class="table-wrap">
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
        <tr
          v-for="f in rows"
          :key="f.name"
          :class="{
            'row-core': f.level === '核心',
            'row-sensitive': f.level === '敏感',
            'row-selected': selectedName === f.name,
          }"
        >
          <td class="pl-4">
            <button
              type="button"
              :class="['field-name', { 'field-name--high': f.level === '核心' || f.level === '敏感' }]"
              :aria-current="selectedName === f.name ? 'true' : undefined"
              @click="$emit('select', f)"
            >
              {{ f.name }}
            </button>
          </td>
          <td class="text-muted">{{ f.desc }}</td>
          <td class="font-mono text-muted" style="font-size: 0.75rem;">{{ f.type }}</td>
          <td>{{ f.category }}</td>
          <td><Badges badge-type="level" :level="f.level" /></td>
          <td class="text-muted">{{ f.regulation }}</td>
        </tr>
        <tr v-if="rows.length === 0"><td colspan="6" class="empty-cell">没有符合条件的字段</td></tr>
      </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Badges from '@/components/Badges.vue'
import { SENSITIVITY_META, type FieldInfo, type SensitivityLevel } from '@/data'

const props = defineProps<{ fields: FieldInfo[]; selectedName?: string }>()
defineEmits<{ select: [field: FieldInfo] }>()

const LEVELS: SensitivityLevel[] = ['核心', '敏感', '内部', '公开']
const active = ref<SensitivityLevel | 'all'>('all')
const query = ref('')

const counts = computed(() => {
  const c: Record<string, number> = {}
  LEVELS.forEach(l => c[l] = props.fields.filter(f => f.level === l).length)
  return c
})

const rows = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.fields.filter(field => {
    const matchesLevel = active.value === 'all' || field.level === active.value
    const matchesQuery = !keyword || field.name.toLowerCase().includes(keyword) || field.desc.toLowerCase().includes(keyword)
    return matchesLevel && matchesQuery
  })
})
</script>

<style scoped>
.field-card {
  min-width: 0;
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
.table-wrap { overflow-x: auto; }
.field-search { position: relative; flex: 1 1 15rem; min-width: 12rem; }
.field-search svg { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); color: var(--muted-foreground); pointer-events: none; }
.field-search input { width: 100%; height: 2rem; padding: 0 0.65rem 0 1.9rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--background); font-size: 0.75rem; outline: none; }
.field-search input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 25%, transparent); }
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
  min-width: 720px;
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
.field-name:hover { color: var(--primary); text-decoration: underline; }
.field-name--high { font-weight: 600; }
.row-core { background: color-mix(in oklab, var(--chart-1) 9%, transparent); }
.row-sensitive { background: color-mix(in oklab, var(--chart-2) 8%, transparent); }
.row-selected { box-shadow: inset 3px 0 0 var(--primary); }
.row-selected td { background: color-mix(in oklab, var(--primary) 8%, transparent); }
.empty-cell { height: 6rem; text-align: center; color: var(--muted-foreground); }
</style>
