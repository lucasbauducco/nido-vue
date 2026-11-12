<template>
  <main class="profile">
    <div class="wrap">
      <div v-if="loading" class="loading" aria-busy="true">
        <div class="skeleton circle"></div>
        <div class="skeleton line"></div>
      </div>

      <div v-else-if="notFound" class="state">
        <h2>No encontramos este perfil</h2>
        <p>Puede que la cuenta ya no exista.</p>
        <router-link class="btn btn-primary" to="/">Volver al inicio</router-link>
      </div>

      <template v-else>
        <header class="top">
          <Avatar :name="user.username" :src="user.avatar" :size="avatarSize" class="big-avatar" />
          <div class="info">
            <div class="row">
              <h1>{{ user.username }}</h1>
              <Icon v-if="user.is_private" name="lock" :size="18" class="lock" aria-label="Cuenta privada" />
              <router-link v-if="user.isMe" to="/settings" class="btn btn-secondary btn-sm">Editar perfil</router-link>
              <FollowButton v-else :user-id="user.user_id" :status="user.followStatus" @change="followChanged" />
            </div>
            <ul class="stats">
              <li><strong>{{ user.posts }}</strong> {{ user.posts === 1 ? 'publicación' : 'publicaciones' }}</li>
              <li><strong>{{ user.followers }}</strong> {{ user.followers === 1 ? 'seguidor' : 'seguidores' }}</li>
              <li><strong>{{ user.following }}</strong> seguidos</li>
            </ul>
            <p v-if="user.bio" class="bio">{{ user.bio }}</p>
          </div>
        </header>

        <div v-if="!user.canView" class="private">
          <Icon name="lock" :size="34" />
          <h2>Esta cuenta es privada</h2>
          <p>{{ user.followStatus === 'pending' ? 'Tu solicitud está pendiente. Vas a ver sus publicaciones cuando la acepte.' : 'Seguí esta cuenta para ver sus fotos y textos.' }}</p>
        </div>

        <template v-else>
          <div class="tabs" role="tablist" aria-label="Publicaciones">
            <button role="tab" type="button" :aria-selected="tab === 'fotos'" :class="{ on: tab === 'fotos' }" @click="tab = 'fotos'"><Icon name="grid" :size="18" /> Fotos</button>
            <button role="tab" type="button" :aria-selected="tab === 'textos'" :class="{ on: tab === 'textos' }" @click="tab = 'textos'"><Icon name="text" :size="18" /> Textos</button>
          </div>

          <template v-if="tab === 'fotos'">
            <div v-if="photos.length" class="grid">
              <button v-for="p in photos" :key="p.post_id" class="cell" type="button" :aria-label="p.title || 'Abrir foto'" @click="open(p)">
                <img :src="assetUrl(p.source)" :alt="p.title || `Foto de ${user.username}`" loading="lazy">
                <span class="over">
                  <span><Icon name="nest" :size="18" filled /> {{ $store.getters.likesOf(p) }}</span>
                  <span><Icon name="comment" :size="18" filled /> {{ p.comment_count }}</span>
                </span>
              </button>
            </div>
            <div v-else class="empty">
              <p>{{ user.isMe ? 'Todavía no publicaste fotos.' : 'Todavía no hay fotos.' }}</p>
              <router-link v-if="user.isMe" class="btn btn-primary" to="/create?tab=foto">Publicar una foto</router-link>
            </div>
          </template>

          <template v-else>
            <div v-if="texts.length" class="list">
              <PostCard v-for="p in texts" :key="p.post_id" :post="p" @deleted="removePost" />
            </div>
            <div v-else class="empty">
              <p>{{ user.isMe ? 'Todavía no publicaste textos.' : 'Todavía no hay textos.' }}</p>
              <router-link v-if="user.isMe" class="btn btn-primary" to="/create?tab=texto">Escribir algo</router-link>
            </div>
          </template>
        </template>
      </template>
    </div>
  </main>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import FollowButton from '@/components/FollowButton.vue'
import PostCard from '@/components/PostCard.vue'
import { openPost } from '@/lib/modal'

export default {
  components: { Avatar, Icon, FollowButton, PostCard },
  data() {
    return { user: {}, posts: [], tab: 'fotos', loading: true, notFound: false, width: window.innerWidth }
  },
  computed: {
    photos() {
      return this.posts.filter(p => p.kind === 'image')
    },
    texts() {
      return this.posts.filter(p => p.kind === 'text')
    },
    avatarSize() {
      return this.width <= 720 ? 86 : 150
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(id) {
        if (id && this.$route.path.startsWith('/u/')) this.load(id)
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
  },
  unmounted() {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    assetUrl,
    onResize() {
      this.width = window.innerWidth
    },
    load(id) {
      this.loading = true
      this.notFound = false
      this.tab = 'fotos'
      api.get(`/users/${id}`).then(r => {
        this.user = r.data
        // mi propio avatar y nombre pueden haber cambiado desde otro dispositivo
        if (r.data.isMe) {
          this.$store.commit('setAvatar', r.data.avatar)
          this.$store.commit('setUsername', r.data.username)
        }
        this.posts = []
        if (r.data.canView) return api.get(`/posts?user=${id}&limit=100`).then(p => { this.posts = p.data })
      }).catch(() => {
        this.notFound = true
      }).finally(() => {
        this.loading = false
      })
    },
    followChanged(status) {
      const was = this.user.followStatus
      this.user.followStatus = status
      if (status === 'following' && was !== 'following') this.user.followers++
      if (status === 'none' && was === 'following') this.user.followers--
      this.user.canView = !this.user.is_private || status === 'following'
      if (this.user.canView && !this.posts.length) this.load(this.user.user_id)
    },
    removePost(id) {
      this.posts = this.posts.filter(p => p.post_id !== id)
      this.user.posts--
    },
    open(post) {
      openPost(this.$router, this.$route, post.post_id)
    }
  }
}
</script>

<style scoped>
.profile { padding: 32px 20px 56px; }
.wrap { max-width: 935px; margin: 0 auto; }
.top { display: flex; gap: 56px; align-items: center; padding: 0 8px 36px; }
.big-avatar { flex: none; }
.info { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.row h1 { font-size: 26px; font-weight: 600; overflow-wrap: anywhere; }
.lock { color: var(--muted); }
.stats { list-style: none; margin: 0; padding: 0; display: flex; gap: 32px; flex-wrap: wrap; }
.stats strong { font-weight: 800; font-family: var(--font-display); }
.bio { white-space: pre-wrap; overflow-wrap: anywhere; max-width: 56ch; }

.tabs { display: flex; justify-content: center; gap: 44px; border-top: 1px solid var(--line); }
.tabs button { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 4px; border: none; border-top: 2px solid transparent; margin-top: -1px; background: transparent; color: var(--muted); font-family: var(--font-display); font-weight: 700; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
.tabs button.on { color: var(--ink); border-top-color: var(--ink); }

.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; margin-top: 8px; }
.cell { position: relative; aspect-ratio: 1; padding: 0; border: none; background: var(--surface-2); overflow: hidden; cursor: pointer; }
.cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
.over { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 20px; background: rgba(0, 0, 0, 0.45); color: #fff; font-weight: 700; opacity: 0; transition: opacity 140ms; }
.over span { display: inline-flex; align-items: center; gap: 6px; }
.cell:hover .over, .cell:focus-visible .over { opacity: 1; }

.list { max-width: 600px; margin: 18px auto 0; display: flex; flex-direction: column; gap: 16px; }
.empty, .state, .private { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 56px 16px; color: var(--muted); }
.state h2, .private h2 { color: var(--ink); }
.private { border-top: 1px solid var(--line); }

.loading { display: flex; align-items: center; gap: 40px; padding: 8px; }
.skeleton { background: linear-gradient(100deg, var(--surface-2) 30%, var(--line) 50%, var(--surface-2) 70%); background-size: 300% 100%; animation: shimmer 1.4s infinite linear; }
.skeleton.circle { width: 150px; height: 150px; border-radius: 50%; }
.skeleton.line { height: 24px; width: 260px; border-radius: 8px; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }

@media (max-width: 720px) {
  .profile { padding: 16px 12px 24px; }
  .top { gap: 20px; padding-bottom: 20px; align-items: flex-start; }
  .row h1 { font-size: 22px; }
  .stats { gap: 18px; font-size: 16px; }
  .tabs { gap: 28px; }
  .grid { gap: 2px; }
  .skeleton.circle { width: 86px; height: 86px; }
}
</style>
