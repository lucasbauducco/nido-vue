<template>
  <main class="explore">
    <div class="container">
      <header class="head">
        <h1>Explorar</h1>
        <div class="search">
          <Icon name="search" :size="20" />
          <label class="sr" for="q">Buscar personas</label>
          <input id="q" v-model="q" type="search" placeholder="Buscar personas por nombre de usuario" autocomplete="off" @input="search">
        </div>
      </header>

      <ul v-if="q.trim()" class="results" aria-live="polite">
        <li v-for="u in people" :key="u.user_id">
          <router-link :to="`/u/${u.user_id}`" class="person">
            <Avatar :name="u.username" :src="u.avatar" :size="44" />
            <strong>{{ u.username }}</strong>
            <Icon v-if="u.is_private" name="lock" :size="16" />
          </router-link>
        </li>
        <li v-if="searched && !people.length" class="none">No encontramos personas con ese nombre.</li>
      </ul>

      <template v-else>
        <h2 class="sub">Fotos recientes</h2>

        <div v-if="loading" class="masonry" aria-busy="true">
          <div v-for="n in 6" :key="n" class="skeleton" :style="{ height: skeletonHeights[n - 1] + 'px' }"></div>
        </div>

        <div v-else-if="error" class="state">
          <h2>No pudimos cargar las fotos</h2>
          <button class="btn btn-primary" type="button" @click="load">Reintentar</button>
        </div>

        <div v-else-if="!posts.length" class="state">
          <h2>Todavía no hay fotos</h2>
          <router-link class="btn btn-primary" to="/create">Publicar una foto</router-link>
        </div>

        <div v-else class="masonry">
          <figure v-for="post in posts" :key="post.post_id" class="tile" tabindex="0" @click="open(post)" @keydown.enter="open(post)">
            <img :src="assetUrl(post.source)" :alt="post.title || `Foto de ${post.username}`" loading="lazy">
            <figcaption>
              <span class="stat"><Icon name="nest" :size="18" filled /> {{ $store.getters.likesOf(post) }}</span>
              <span class="stat"><Icon name="comment" :size="18" filled /> {{ post.comment_count }}</span>
            </figcaption>
          </figure>
        </div>
      </template>
    </div>
  </main>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import { openPost } from '@/lib/modal'

export default {
  components: { Icon, Avatar },
  data() {
    return {
      q: '',
      people: [],
      searched: false,
      timer: null,
      posts: [],
      loading: true,
      error: false,
      skeletonHeights: [260, 340, 220, 300, 380, 240]
    }
  },
  created() {
    this.load()
  },
  unmounted() {
    clearTimeout(this.timer)
  },
  methods: {
    assetUrl,
    load() {
      this.loading = true
      this.error = false
      api.get('/posts?kind=image&limit=60').then(r => {
        this.posts = r.data
      }).catch(() => {
        this.error = true
      }).finally(() => {
        this.loading = false
      })
    },
    search() {
      clearTimeout(this.timer)
      const q = this.q.trim()
      if (!q) {
        this.people = []
        this.searched = false
        return
      }
      this.timer = setTimeout(() => {
        api.get('/users/search', { params: { q } }).then(r => {
          if (q === this.q.trim()) {
            this.people = r.data
            this.searched = true
          }
        })
      }, 250)
    },
    open(post) {
      openPost(this.$router, this.$route, post.post_id)
    }
  }
}
</script>

<style scoped>
.explore { padding: 28px 0 56px; }
.head { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; max-width: 560px; }
.search { position: relative; display: flex; align-items: center; color: var(--muted); }
.search :deep(.icon) { position: absolute; left: 16px; pointer-events: none; }
.search input { width: 100%; height: 50px; padding: 0 16px 0 46px; border-radius: 14px; border: 1px solid var(--line); background: var(--surface); font-size: 18px; }
.search input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--tint); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.sub { font-size: 15px; color: var(--muted); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.08em; }

.results { list-style: none; margin: 0; padding: 0; max-width: 560px; display: flex; flex-direction: column; gap: 4px; }
.person { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 12px; color: var(--ink); }
.person:hover { background: var(--surface-2); text-decoration: none; }
.none { color: var(--muted); padding: 12px 10px; }

.masonry { column-count: 3; column-gap: 12px; }
.tile, .skeleton { break-inside: avoid; margin: 0 0 12px; border-radius: 14px; overflow: hidden; }
.skeleton { background: linear-gradient(100deg, var(--surface-2) 30%, var(--line) 50%, var(--surface-2) 70%); background-size: 300% 100%; animation: shimmer 1.4s infinite linear; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
.tile { position: relative; background: var(--surface-2); cursor: pointer; border: 1px solid var(--line); }
.tile img { width: 100%; height: auto; display: block; }
.tile figcaption { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 18px; background: rgba(0, 0, 0, 0.45); color: #fff; font-weight: 700; opacity: 0; transition: opacity 140ms; }
.tile:hover figcaption, .tile:focus-visible figcaption { opacity: 1; }
.stat { display: inline-flex; align-items: center; gap: 6px; }
.state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 56px 16px; text-align: center; }

@media (max-width: 900px) { .masonry { column-count: 2; } }
@media (max-width: 720px) { .explore { padding-top: 16px; } .masonry { column-gap: 8px; } .tile, .skeleton { margin-bottom: 8px; } }
</style>
