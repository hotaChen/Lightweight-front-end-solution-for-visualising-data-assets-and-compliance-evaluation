<template>
  <aside :class="['sidebar', { 'sidebar--collapsed': collapsed }]">
    <div class="sidebar-inner">
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false })
</script>

<style scoped>
.sidebar {
  width: 16rem;
  min-width: 16rem;
  height: 100vh;
  background: var(--sidebar-background);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
}
.sidebar--collapsed {
  width: 3.5rem;
  min-width: 3.5rem;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
