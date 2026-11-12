<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill-rule="evenodd"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<script>
const paths = {
  // el nido de hornero: cupula con una abertura. Es el icono de "me gusta"
  nest: 'M3 20C3 11 7 4 12 4s9 7 9 16zM9.5 20c0-3.5 1.1-6 2.5-6s2.5 2.5 2.5 6z',
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  plus: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 8v8M8 12h8',
  user: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  comment: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.8A8 8 0 1 1 21 12z',
  close: 'M18 6L6 18M6 6l12 12',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'
}

export default {
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 22 },
    filled: { type: Boolean, default: false }
  },
  data() {
    return { paths }
  }
}
</script>

<style scoped>
.icon { flex: none; display: block; }
</style>
