<template>
  <section class="stories" aria-label="Historias">
    <ul>
      <!-- la propia: crear o ver -->
      <li v-if="logged">
        <button type="button" class="bubble" :aria-label="mine ? 'Ver tu historia' : 'Crear una historia'" @click="mine ? view(0) : create()">
          <span class="ring" :class="mine ? (isUnseen(mine) ? 'new' : 'seen') : 'none'">
            <Avatar :name="username" :src="avatar" :size="64" />
          </span>
          <span class="plus" role="presentation" @click.stop="create"><Icon name="plus" :size="14" /></span>
          <span class="label">Tu historia</span>
        </button>
      </li>

      <li v-for="(g, i) in others" :key="g.user_id">
        <button type="button" class="bubble" :aria-label="`Ver la historia de ${g.username}`" @click="view(offset + i)">
          <span class="ring" :class="isUnseen(g) ? 'new' : 'seen'">
            <Avatar :name="g.username" :src="g.avatar" :size="64" />
          </span>
          <span class="label">{{ g.username }}</span>
        </button>
      </li>

      <li v-if="!loading && !others.length && !mine" class="hint">
        Las historias duran 24 horas. Subí la primera.
      </li>
    </ul>

    <StoryViewer v-if="viewing !== null" :groups="groups" :start="viewing" @close="close" @seen="markSeen" @deleted="load" />
  </section>
</template>

<script>
import api from '@/api.js'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import StoryViewer from '@/components/StoryViewer.vue'

const SEEN_KEY = 'nido-seen-stories'

export default {
  components: { Avatar, Icon, StoryViewer },
  data() {
    return { groups: [], loading: true, viewing: null, seen: [] }
  },
  computed: {
    logged() {
      return !!this.$store.getters.token
    },
    username() {
      return this.$store.getters.username || ''
    },
    avatar() {
      return this.$store.getters.avatar
    },
    mine() {
      return this.groups.find(g => g.isMine) || null
    },
    // los grupos que no son mios (el mio, si existe, va primero en `groups`)
    others() {
      return this.groups.filter(g => !g.isMine)
    },
    offset() {
      return this.mine ? 1 : 0
    }
  },
  created() {
    try {
      this.seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
    } catch (e) {
      this.seen = []
    }
    this.load()
  },
  methods: {
    load() {
      api.get('/stories').then(r => {
        this.groups = r.data
      }).catch(() => {
        this.groups = []
      }).finally(() => {
        this.loading = false
      })
    },
    isUnseen(group) {
      return group.stories.some(s => !this.seen.includes(s.story_id))
    },
    markSeen(id) {
      if (this.seen.includes(id)) return
      this.seen = [...this.seen, id].slice(-300)
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(this.seen))
      } catch (e) {
        // sin almacenamiento: se muestran como nuevas en la proxima visita
      }
    },
    view(index) {
      this.viewing = index
    },
    close() {
      this.viewing = null
    },
    create() {
      this.$router.push('/create?tab=historia')
    }
  }
}
</script>

<style scoped>
.stories { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 14px 4px 10px; }
ul { list-style: none; margin: 0; padding: 0 12px; display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none; }
ul::-webkit-scrollbar { display: none; }
li { flex: none; }
.bubble { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 76px; padding: 0; border: none; background: transparent; }
.ring { display: inline-flex; padding: 3px; border-radius: 50%; }
.ring :deep(.avatar) { border: 3px solid var(--surface); box-sizing: content-box; }
.ring.new { background: linear-gradient(45deg, #F2B33D, var(--accent) 55%, #C23A6B); }
.ring.seen { background: var(--line); }
.ring.none { background: transparent; }
.plus { position: absolute; right: 6px; top: 46px; display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: var(--accent-ink); border: 2px solid var(--surface); }
.label { font-size: 14px; max-width: 76px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); }
.hint { align-self: center; color: var(--muted); font-size: 16px; white-space: nowrap; padding-left: 4px; }
</style>
