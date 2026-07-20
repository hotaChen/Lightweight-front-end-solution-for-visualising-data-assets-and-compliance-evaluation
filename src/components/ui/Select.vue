<template>
  <div class="select-root">
    <select
      :value="modelValue"
      class="select-trigger"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <svg class="select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.select-root {
  position: relative;
  display: inline-flex;
}
.select-trigger {
  height: 2.25rem;
  padding: 0 2rem 0 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--background);
  font-size: 0.875rem;
  outline: none;
  appearance: none;
  cursor: pointer;
  color: var(--foreground);
  min-width: 0;
  transition: border-color 0.15s;
}
.select-trigger:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 25%, transparent);
}
.select-chevron {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--muted-foreground);
  width: 1rem;
  height: 1rem;
}
</style>
