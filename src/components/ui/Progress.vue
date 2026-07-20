<template>
  <div class="progress">
    <div class="progress-fill" :style="{ width: `${value}%` }" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<style scoped>
.progress {
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--secondary);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 9999px;
  background: var(--primary);
  transition: width 0.3s;
}
</style>
