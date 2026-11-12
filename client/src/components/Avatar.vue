<template>
  <span class="avatar" :class="src ? '' : tone" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.42 + 'px' }" aria-hidden="true">
    <img v-if="src" :src="assetUrl(src)" alt="" loading="lazy">
    <template v-else>{{ initial }}</template>
  </span>
</template>

<script>
import { assetUrl } from '@/api'

export default {
  props: {
    name: { type: String, default: '' },
    src: { type: String, default: null },
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
  },
  methods: { assetUrl }
}
</script>

<style scoped>
.avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-family: var(--font-display); font-weight: 700; flex: none; user-select: none; overflow: hidden; background: var(--surface-2); }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.t-accent { background: var(--tint); color: var(--accent); }
.t-pampa { background: color-mix(in srgb, var(--pampa) 18%, var(--surface)); color: var(--pampa); }
.t-cielo { background: color-mix(in srgb, var(--cielo) 18%, var(--surface)); color: var(--cielo); }
</style>
