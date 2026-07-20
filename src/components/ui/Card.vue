<template>
  <div :class="['card', { 'card--no-pad': noPad }]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ noPad?: boolean }>(), { noPad: false })
</script>

<style scoped>
.card {
  border-radius: 0.625rem;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--card-foreground);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.card--no-pad {
  padding: 0;
  gap: 0;
}
</style>
