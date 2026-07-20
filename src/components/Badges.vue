<template>
  <span v-if="badgeType === 'level'" :class="['level-badge', levelClasses[level]]">
    <span class="level-dot" :style="{ background: SENSITIVITY_META[level].color }" />
    {{ level }}
  </span>

  <span v-else-if="badgeType === 'compliance'" :class="['compliance-badge', complianceClasses[status]]">
    {{ status }}
  </span>

  <span v-else-if="badgeType === 'risk'" class="risk-badge" :style="{ color: riskColor }">
    <span class="risk-dot" :style="{ background: riskColor }" />
    {{ score }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SENSITIVITY_META, type SensitivityLevel, type ComplianceStatus } from '@/data'

const props = defineProps<
  | { badgeType: 'level'; level: SensitivityLevel }
  | { badgeType: 'compliance'; status: ComplianceStatus }
  | { badgeType: 'risk'; score: number }
>()

const levelClasses: Record<SensitivityLevel, string> = {
  核心: 'level--core',
  敏感: 'level--sensitive',
  内部: 'level--internal',
  公开: 'level--public',
}

const complianceClasses: Record<ComplianceStatus, string> = {
  已合规: 'comp--ok',
  待整改: 'comp--warn',
  超期整改: 'comp--overdue',
}

const riskColor = computed(() => {
  if (props.badgeType === 'risk') {
    return props.score >= 80 ? 'var(--chart-1)' : props.score >= 60 ? 'var(--chart-2)' : 'var(--chart-4)'
  }
  return 'var(--chart-1)'
})
</script>

<style scoped>
/* Level badge */
.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: var(--radius);
  border: 1px solid;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}
.level-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
}
.level--core {
  background: color-mix(in oklab, var(--chart-1) 12%, transparent);
  color: var(--chart-1);
  border-color: color-mix(in oklab, var(--chart-1) 30%, transparent);
}
.level--sensitive {
  background: color-mix(in oklab, var(--chart-2) 15%, transparent);
  color: oklch(0.5 0.16 55);
  border-color: color-mix(in oklab, var(--chart-2) 35%, transparent);
}
.level--internal {
  background: color-mix(in oklab, var(--chart-4) 12%, transparent);
  color: var(--chart-4);
  border-color: color-mix(in oklab, var(--chart-4) 30%, transparent);
}
.level--public {
  background: var(--muted);
  color: var(--muted-foreground);
  border-color: var(--border);
}

/* Compliance badge */
.compliance-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius);
  border: 1px solid;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}
.comp--ok {
  background: color-mix(in oklab, var(--chart-4) 12%, transparent);
  color: var(--chart-4);
  border-color: color-mix(in oklab, var(--chart-4) 30%, transparent);
}
.comp--warn {
  background: color-mix(in oklab, var(--chart-2) 15%, transparent);
  color: oklch(0.5 0.16 55);
  border-color: color-mix(in oklab, var(--chart-2) 35%, transparent);
}
.comp--overdue {
  background: color-mix(in oklab, var(--chart-1) 12%, transparent);
  color: var(--chart-1);
  border-color: color-mix(in oklab, var(--chart-1) 30%, transparent);
}

/* Risk badge */
.risk-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
}
.risk-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}
</style>
