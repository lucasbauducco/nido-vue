<template>
  <form class="composer" @submit.prevent="publish">
    <Avatar :name="username" :src="avatar" :size="42" />
    <div class="field-area">
      <label class="sr" for="composer-text">Escribir una publicación</label>
      <textarea id="composer-text" ref="box" v-model="text" rows="2" placeholder="¿Qué está pasando en tu nido?" :maxlength="max" @input="grow"></textarea>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="bar">
        <router-link class="photo" to="/create?tab=foto"><Icon name="image" :size="20" /> Foto</router-link>
        <span class="count" :class="{ near: left <= 20 }" aria-live="polite">{{ left }}</span>
        <button class="btn btn-primary btn-sm" type="submit" :disabled="!text.trim() || busy">{{ busy ? 'Publicando...' : 'Publicar' }}</button>
      </div>
    </div>
  </form>
</template>

<script>
import api from '@/api.js'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'

export default {
  components: { Avatar, Icon },
  emits: ['posted'],
  data() {
    return { text: '', max: 280, busy: false, error: '' }
  },
  computed: {
    left() {
      return this.max - this.text.length
    },
    username() {
      return this.$store.getters.username || ''
    },
    avatar() {
      return this.$store.getters.avatar
    }
  },
  methods: {
    grow() {
      const el = this.$refs.box
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 220) + 'px'
    },
    publish() {
      if (!this.text.trim() || this.busy) return
      this.busy = true
      this.error = ''
      api.post('/posts/text', { text: this.text }).then(r => {
        if (r.data.ok) {
          this.text = ''
          this.$nextTick(this.grow)
          this.$emit('posted')
        }
      }).catch(e => {
        this.error = (e.response && e.response.data && e.response.data.error) || 'No pudimos publicar. Intentá de nuevo.'
      }).finally(() => {
        this.busy = false
      })
    }
  }
}
</script>

<style scoped>
.composer { display: flex; gap: 12px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 14px; }
.field-area { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
textarea { width: 100%; resize: none; border: none; outline: none; background: transparent; font-size: 20px; line-height: 1.35; padding: 8px 0; min-height: 52px; }
textarea::placeholder { color: var(--muted); }
.bar { display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
.photo { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; margin-right: auto; }
.photo:hover { text-decoration: none; opacity: 0.8; }
.count { color: var(--muted); font-size: 15px; font-variant-numeric: tabular-nums; }
.count.near { color: var(--accent); font-weight: 700; }
.error { color: #D64545; font-size: 16px; }
</style>
