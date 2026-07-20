<template>
  <div class="lineage-col">
    <span class="lineage-col-title">{{ title }}</span>
    <div v-if="tables.length === 0" class="lineage-empty">
      {{ dir === 'from' ? '无上游（源头表）' : '无下游（末端表）' }}
    </div>
    <router-link
      v-for="t in tables"
      :key="t.id"
      :to="`/catalog/${t.id}`"
      class="lineage-node"
    >
      {{ t.cnName }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import type { DataTable } from '@/data'

defineProps<{
  title: string
  tables: DataTable[]
  dir: 'from' | 'to'
}>()
</script>

<style scoped>
.lineage-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 11rem;
}
.lineage-col-title {
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.lineage-empty {
  border-radius: 0.5rem;
  border: 1px dashed var(--border);
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}
.lineage-node {
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background: var(--card);
  padding: 0.5rem 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  display: block;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}
.lineage-node:hover {
  border-color: var(--primary);
  background: var(--accent);
}
</style>
