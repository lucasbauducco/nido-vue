<template>
  <main class="feed">
    <div class="container">
      <header class="feed-head">
        <h1>Lo más <em>nuevo</em></h1>
        <p>Fotos recién salidas del horno.</p>
      </header>

      <div v-if="loading" class="masonry" aria-busy="true">
        <div v-for="n in 6" :key="n" class="skeleton" :style="{ height: skeletonHeights[n - 1] + 'px' }"></div>
      </div>

      <div v-else-if="error" class="state">
        <h2>No pudimos cargar las fotos</h2>
        <p>Revisá que el servidor esté corriendo e intentá de nuevo.</p>
        <button class="btn btn-primary" type="button" @click="load">Reintentar</button>
      </div>

      <div v-else-if="!posts.length" class="state">
        <NidoLogo mark-only class="state-logo" />
        <h2>Todavía no hay publicaciones</h2>
        <p>Sé la primera persona en llenar este nido.</p>
        <router-link class="btn btn-primary" to="/upload">Publicar una foto</router-link>
      </div>

      <div v-else class="masonry">
        <figure
          v-for="post in posts"
          :key="post.post_id"
          class="tile"
          tabindex="0"
          @click="open(post)"
          @keydown.enter="open(post)"
        >
          <img :src="assetUrl(post.source)" :alt="post.title" loading="lazy">
          <figcaption>
            <span class="title">{{ post.title }}</span>
            <button
              class="like"
              :class="{ liked: postLikes.includes(post.post_id) }"
              type="button"
              :aria-label="postLikes.includes(post.post_id) ? 'Ya te gustó' : 'Me gusta'"
              @click.stop="likePost(post)"
            >
              <Icon name="nest" :size="20" :filled="postLikes.includes(post.post_id)" />
              <span>{{ post.likes }}</span>
            </button>
          </figcaption>
        </figure>
      </div>
    </div>
  </main>
  <router-view></router-view>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Icon from '@/components/Icon.vue'
import NidoLogo from '@/components/NidoLogo.vue'

export default {
  components: { Icon, NidoLogo },
  data() {
    return {
      posts: [],
      postLikes: [],
      loading: true,
      error: false,
      skeletonHeights: [260, 340, 220, 300, 380, 240]
    }
  },
  created() {
    this.load()
  },
  watch: {
    // al cerrar el modal de una publicacion se actualizan los me gusta
    '$route'(to, from) {
      if (to.path === '/' && from.path.startsWith('/post')) this.refresh()
    }
  },
  methods: {
    assetUrl,
    load() {
      this.loading = true
      this.error = false
      this.refresh()
    },
    refresh() {
      const requests = [api.get('/posts')]
      if (this.$store.getters.token) requests.push(api.get('/posts/likes'))

      Promise.all(requests)
        .then(([posts, likes]) => {
          this.posts = posts.data
          this.postLikes = likes ? likes.data : []
        })
        .catch(() => {
          this.error = !this.posts.length
        })
        .finally(() => {
          this.loading = false
        })
    },
    likePost(post) {
      if (!this.$store.getters.token) {
        this.$router.push('/login')
        return
      }
      if (this.postLikes.includes(post.post_id)) return

      api.post(`/posts/like/${post.post_id}`).then(response => {
        if (response.data.ok) {
          post.likes++
          this.postLikes.push(post.post_id)
        }
      })
    },
    open(post) {
      this.$router.push(`/post/${post.post_id}`)
    }
  }
}
</script>

<style scoped>
.feed { min-height: calc(100vh - 64px); padding: 32px 0 56px; }
.feed-head { margin-bottom: 28px; display: flex; flex-direction: column; gap: 4px; }
.feed-head h1 em { font-style: normal; color: var(--accent); }
.feed-head p { color: var(--muted); }

.masonry { column-count: 3; column-gap: 16px; }
.tile, .skeleton { break-inside: avoid; margin: 0 0 16px; border-radius: 16px; overflow: hidden; }
.skeleton { background: linear-gradient(100deg, var(--surface-2) 30%, var(--line) 50%, var(--surface-2) 70%); background-size: 300% 100%; animation: shimmer 1.4s infinite linear; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }

.tile { position: relative; background: var(--surface-2); cursor: pointer; border: 1px solid var(--line); }
.tile img { width: 100%; height: auto; display: block; }
.tile figcaption {
  position: absolute; inset: auto 0 0 0; padding: 36px 12px 12px;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #fff; opacity: 0; transition: opacity 160ms;
}
.tile:hover figcaption, .tile:focus-visible figcaption, .tile:focus-within figcaption { opacity: 1; }
.title { font-family: var(--font-display); font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.like {
  display: inline-flex; align-items: center; gap: 6px; flex: none;
  height: 34px; padding: 0 12px; border-radius: 999px; border: none;
  background: rgba(255, 255, 255, 0.18); color: #fff; font-weight: 700; backdrop-filter: blur(6px);
}
.like:hover { background: rgba(255, 255, 255, 0.3); }
.like.liked { background: var(--accent); color: var(--accent-ink); }

.state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 72px 16px; color: var(--muted); }
.state h2 { color: var(--ink); }
.state-logo { font-size: 36px; margin-bottom: 4px; }
.state .btn { margin-top: 8px; }

@media (max-width: 900px) { .masonry { column-count: 2; } }
@media (max-width: 720px) {
  .feed { padding-top: 20px; }
  .masonry { column-gap: 10px; }
  .tile, .skeleton { margin-bottom: 10px; border-radius: 12px; }
  h1 { font-size: 28px; }
  /* en pantallas tactiles no hay hover: la informacion queda visible */
  .tile figcaption { opacity: 1; padding-top: 28px; justify-content: flex-end; }
  .title { display: none; }
}
@media (hover: none) { .tile figcaption { opacity: 1; } }
</style>
