<template>
  <main class="home">
    <div class="layout">
      <section class="column" aria-label="Publicaciones">
        <StoriesBar :key="storiesKey" />

        <Composer v-if="logged" @posted="reload" />

        <div class="tabs" role="tablist" aria-label="Qué ver">
          <button role="tab" type="button" :aria-selected="tab === 'new'" :class="{ on: tab === 'new' }" @click="setTab('new')">Lo más nuevo</button>
          <button v-if="logged" role="tab" type="button" :aria-selected="tab === 'following'" :class="{ on: tab === 'following' }" @click="setTab('following')">Siguiendo</button>
        </div>

        <div v-if="loading" class="feed" aria-busy="true">
          <div v-for="n in 3" :key="n" class="skeleton" :style="{ height: skeletonHeights[n - 1] + 'px' }"></div>
        </div>

        <div v-else-if="error" class="state">
          <h2>No pudimos cargar las publicaciones</h2>
          <p>Revisá que el servidor esté corriendo e intentá de nuevo.</p>
          <button class="btn btn-primary" type="button" @click="load">Reintentar</button>
        </div>

        <div v-else-if="!posts.length" class="state">
          <NidoLogo mark-only class="state-logo" />
          <h2>{{ tab === 'following' ? 'Todavía no seguís a nadie' : 'Todavía no hay publicaciones' }}</h2>
          <p>{{ tab === 'following' ? 'Seguí a otras personas para ver sus fotos y textos acá.' : 'Sé la primera persona en llenar este nido.' }}</p>
          <router-link v-if="tab === 'following'" class="btn btn-primary" to="/explore">Buscar personas</router-link>
          <router-link v-else class="btn btn-primary" to="/create">Publicar</router-link>
        </div>

        <div v-else class="feed">
          <PostCard v-for="post in posts" :key="post.post_id" :post="post" @deleted="removePost" />
        </div>
      </section>

      <aside class="rail" aria-label="Sugerencias">
        <template v-if="logged">
          <router-link :to="`/u/${userId}`" class="me">
            <Avatar :name="username" :src="avatar" :size="52" />
            <span class="me-name">{{ username }}</span>
          </router-link>

          <div v-if="requests.length" class="block">
            <h2>Solicitudes para seguirte</h2>
            <router-link to="/settings" class="requests">{{ requests.length }} {{ requests.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes' }}</router-link>
          </div>

          <div v-if="suggestions.length" class="block">
            <h2>Sugerencias para vos</h2>
            <ul>
              <li v-for="u in suggestions" :key="u.user_id">
                <router-link :to="`/u/${u.user_id}`" class="person">
                  <Avatar :name="u.username" :src="u.avatar" :size="40" />
                  <span>{{ u.username }}</span>
                </router-link>
                <FollowButton :user-id="u.user_id" :status="u.status || 'none'" @change="s => u.status = s" />
              </li>
            </ul>
          </div>
        </template>

        <div v-else class="block join">
          <NidoLogo class="join-logo" />
          <p>Ingresá para dar horneros, comentar, seguir personas y subir historias.</p>
          <router-link class="btn btn-primary btn-block" to="/register">Crear cuenta</router-link>
          <router-link class="btn btn-secondary btn-block" to="/login">Ingresar</router-link>
        </div>

        <p class="foot">Nido · Proyecto educativo hecho con Vue y Node</p>
      </aside>
    </div>
  </main>
</template>

<script>
import api from '@/api.js'
import PostCard from '@/components/PostCard.vue'
import StoriesBar from '@/components/StoriesBar.vue'
import Composer from '@/components/Composer.vue'
import Avatar from '@/components/Avatar.vue'
import FollowButton from '@/components/FollowButton.vue'
import NidoLogo from '@/components/NidoLogo.vue'

export default {
  components: { PostCard, StoriesBar, Composer, Avatar, FollowButton, NidoLogo },
  data() {
    return {
      tab: 'new',
      posts: [],
      loading: true,
      error: false,
      suggestions: [],
      requests: [],
      storiesKey: 0,
      skeletonHeights: [520, 140, 440]
    }
  },
  computed: {
    logged() {
      return !!this.$store.getters.token
    },
    userId() {
      return this.$store.getters.loggedId
    },
    username() {
      return this.$store.getters.username || ''
    },
    avatar() {
      return this.$store.getters.avatar
    }
  },
  created() {
    this.load()
    if (this.logged) {
      api.get('/users/suggestions').then(r => { this.suggestions = r.data }).catch(() => {})
      api.get('/users/requests').then(r => { this.requests = r.data }).catch(() => {})
    }
  },
  methods: {
    setTab(tab) {
      if (this.tab === tab) return
      this.tab = tab
      this.load()
    },
    load() {
      this.loading = true
      this.error = false
      this.fetch()
    },
    reload() {
      this.fetch()
    },
    // fotos y textos juntos, de la mas nueva a la mas vieja
    fetch() {
      const query = this.tab === 'following' ? '?feed=following&limit=60' : '?limit=60'
      api.get('/posts' + query).then(r => {
        this.posts = r.data
        this.error = false
      }).catch(() => {
        this.error = !this.posts.length
      }).finally(() => {
        this.loading = false
      })
    },
    removePost(id) {
      this.posts = this.posts.filter(p => p.post_id !== id)
    }
  }
}
</script>

<style scoped>
.home { padding: 28px 20px 56px; }
.layout { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 600px) 300px; gap: 40px; justify-content: center; align-items: start; }
.column { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--line); }
.tabs button { height: 46px; padding: 0 16px; border: none; border-bottom: 3px solid transparent; background: transparent; color: var(--muted); font-family: var(--font-display); font-weight: 600; font-size: 15px; margin-bottom: -1px; }
.tabs button:hover { color: var(--ink); }
.tabs button.on { color: var(--ink); border-bottom-color: var(--accent); }

.feed { display: flex; flex-direction: column; gap: 18px; }
.skeleton { border-radius: 16px; background: linear-gradient(100deg, var(--surface-2) 30%, var(--line) 50%, var(--surface-2) 70%); background-size: 300% 100%; animation: shimmer 1.4s infinite linear; }
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }

.state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 56px 16px; color: var(--muted); }
.state h2 { color: var(--ink); }
.state-logo { font-size: 36px; margin-bottom: 4px; }
.state .btn { margin-top: 8px; }

/* columna derecha, como el portal web de Instagram */
.rail { position: sticky; top: 28px; display: flex; flex-direction: column; gap: 22px; }
.me { display: flex; align-items: center; gap: 12px; color: var(--ink); }
.me:hover { text-decoration: none; }
.me-name { font-family: var(--font-display); font-weight: 700; }
.block h2 { font-size: 15px; font-weight: 700; color: var(--muted); margin-bottom: 12px; }
.block ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.block li { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.person { display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--ink); font-weight: 600; }
.person span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.person:hover { text-decoration: none; opacity: 0.8; }
.requests { font-weight: 700; }
.join { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.join-logo { font-size: 22px; }
.join p { color: var(--muted); }
.foot { color: var(--muted); font-size: 14px; }

@media (max-width: 1100px) {
  .layout { grid-template-columns: minmax(0, 600px); }
  .rail { display: none; }
}
@media (max-width: 720px) {
  .home { padding: 12px 12px 24px; }
}
</style>
