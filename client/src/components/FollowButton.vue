<template>
  <button class="btn btn-sm" :class="status === 'none' ? 'btn-primary' : 'btn-secondary'" type="button" :disabled="busy" @click="toggle">
    {{ label }}
  </button>
</template>

<script>
import api from '@/api.js'

// status: 'none' | 'pending' (solicitud enviada a una cuenta privada) | 'following'
export default {
  props: {
    userId: { type: Number, required: true },
    status: { type: String, default: 'none' }
  },
  emits: ['change'],
  data() {
    return { busy: false }
  },
  computed: {
    label() {
      if (this.status === 'following') return 'Siguiendo'
      if (this.status === 'pending') return 'Solicitado'
      return 'Seguir'
    }
  },
  methods: {
    toggle() {
      if (!this.$store.getters.token) {
        this.$router.push('/login')
        return
      }
      this.busy = true
      const request = this.status === 'none'
        ? api.post(`/users/${this.userId}/follow`)
        : api.delete(`/users/${this.userId}/follow`)

      request.then(r => {
        if (r.data.ok) this.$emit('change', r.data.status)
      }).finally(() => {
        this.busy = false
      })
    }
  }
}
</script>
