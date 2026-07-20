<template>
  <hr :class="['separator', orientation === 'vertical' ? 'separator--v' : 'separator--h']" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ orientation?: 'horizontal' | 'vertical' }>(), { orientation: 'horizontal' })
</script>

<style scoped>
.separator {
  border: none;
  background: var(--border);
}
.separator--h {
  width: 100%;
  height: 1px;
}
.separator--v {
  width: 1px;
  height: 100%;
  min-height: 1rem;
}
</style>
