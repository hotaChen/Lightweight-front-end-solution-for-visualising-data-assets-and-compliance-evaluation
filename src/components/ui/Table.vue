<template>
  <div class="table-wrap">
    <table class="table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  width: 100%;
  overflow: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  caption-side: bottom;
  font-size: 0.875rem;
}
:deep(th) {
  height: 2.5rem;
  padding: 0 0.75rem;
  text-align: left;
  font-weight: 500;
  color: var(--muted-foreground);
  vertical-align: middle;
  white-space: nowrap;
}
:deep(td) {
  padding: 0.75rem;
  vertical-align: middle;
}
:deep(tr) {
  border-bottom: 1px solid var(--border);
}
:deep(tr:last-child) {
  border-bottom: none;
}
:deep(thead tr) {
  background: color-mix(in oklab, var(--muted) 40%, transparent);
}
:deep(thead tr:hover) {
  background: color-mix(in oklab, var(--muted) 40%, transparent);
}
:deep(tbody tr:hover) {
  background: color-mix(in oklab, var(--muted) 30%, transparent);
}
</style>
