<template>
  <span class="avatar" :class="tone" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.42 + 'px' }" aria-hidden="true">{{ initial }}</span>
</template>

<script>
export default {
  props: {
    name: { type: String, default: '' },
    size: { type: Number, default: 36 }
  },
  computed: {
    initial() {
      return (this.name || '?').trim().charAt(0).toUpperCase()
    },
    // color estable segun el nombre
    tone() {
      const n = (this.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      return ['t-accent', 't-pampa', 't-cielo'][n % 3]
    }
  }
}
</script>

<style scoped>
.avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-family: var(--font-display); font-weight: 700; flex: none; user-select: none; }
.t-accent { background: var(--tint); color: var(--accent); }
.t-pampa { background: color-mix(in srgb, var(--pampa) 18%, var(--surface)); color: var(--pampa); }
.t-cielo { background: color-mix(in srgb, var(--cielo) 18%, var(--surface)); color: var(--cielo); }
</style>
