<template>
  <div class="tooltip-wrap" @mouseenter="show = true" @mouseleave="show = false">
    <slot name="trigger" />
    <Teleport to="body">
      <div v-if="show" class="tooltip-content">
        {{ text }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ text: string }>()
const show = ref(false)
</script>

<style scoped>
.tooltip-wrap {
  display: inline-flex;
  position: relative;
}
.tooltip-content {
  position: fixed;
  z-index: 9999;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
  background: var(--popover);
  color: var(--popover-foreground);
  border: 1px solid var(--border);
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  pointer-events: none;
}
</style>
