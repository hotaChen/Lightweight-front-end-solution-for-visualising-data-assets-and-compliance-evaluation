<template>
  <div :class="['card-header']">
    <slot />
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
</style>
