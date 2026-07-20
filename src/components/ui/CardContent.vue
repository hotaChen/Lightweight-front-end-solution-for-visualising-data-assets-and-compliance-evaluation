<template>
  <div :class="['card-content']">
    <slot />
  </div>
</template>

<style scoped>
.card-content {
  flex: 1;
}
</style>
