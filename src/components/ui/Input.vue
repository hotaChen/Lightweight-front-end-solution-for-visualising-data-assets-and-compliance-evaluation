<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :class="['input']"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.input {
  height: 2.25rem;
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--background);
  padding: 0 0.75rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 25%, transparent);
}
.input::placeholder {
  color: var(--muted-foreground);
}
</style>
