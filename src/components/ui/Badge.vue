<template>
  <span :class="['badge', `badge--${variant}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'default' | 'outline' }>(), { variant: 'default' })
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.0625rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.25rem;
  white-space: nowrap;
}
.badge--default {
  background: var(--primary);
  color: var(--primary-foreground);
}
.badge--outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--foreground);
}
</style>
