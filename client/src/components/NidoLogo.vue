<template>
  <span class="logo" :class="{ light }">
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="currentColor" fill-rule="evenodd" d="M3 42C3 22 12 8 24 8s21 14 21 34zM17 42c0-7 3-12 7-12s7 5 7 12z" />
    </svg>
    <span v-if="!markOnly" class="word">nido</span>
  </span>
</template>

<script>
export default {
  props: {
    light: { type: Boolean, default: false },
    markOnly: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 8px; color: var(--accent); line-height: 1; }
.logo svg { width: 1.5em; height: 1.5em; flex: none; }
.word { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.04em; color: var(--ink); font-size: 1.35em; }
.logo.light, .logo.light .word { color: #fff; }
</style>
