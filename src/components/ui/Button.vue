<template>
  <button :class="['btn', `btn--${variant}`, `btn--${size}`]">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'icon'
}>(), {
  variant: 'default',
  size: 'default',
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: var(--radius);
  transition: all 0.15s;
  white-space: nowrap;
}
.btn--default {
  height: 2.25rem;
  padding: 0 1rem;
}
.btn--sm {
  height: 2rem;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
}
.btn--icon {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

.btn--default {
  background: var(--primary);
  color: var(--primary-foreground);
}
.btn--default:hover {
  opacity: 0.9;
}
.btn--ghost {
  background: transparent;
  color: var(--foreground);
}
.btn--ghost:hover {
  background: var(--accent);
}
.btn--outline {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
}
.btn--outline:hover {
  background: var(--accent);
}
</style>
