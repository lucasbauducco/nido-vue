<template>
  <div class="overlay" @click="close">
    <div class="modal" :class="{ text: post.kind === 'text' }" role="dialog" aria-modal="true" :aria-label="post.title || 'Publicación'" @click.stop>
      <figure v-if="post.kind === 'image'" class="photo" @dblclick="toggleLike">
        <img v-if="post.source" :src="assetUrl(post.source)" :alt="post.title || `Foto de ${post.username}`" draggable="false">
        <span v-if="burst" class="burst" aria-hidden="true"><Icon name="nest" :size="110" filled /></span>
      </figure>

      <div class="panel">
        <header class="panel-top">
          <router-link :to="`/u/${post.user_id}`" class="who" @click="close">
            <Avatar :name="post.username" :src="post.avatar" :size="38" />
            <strong>{{ post.username }}</strong>
          </router-link>
          <span class="when">{{ timeAgo(post.created_at) }}</span>
          <button class="icon-close" type="button" aria-label="Cerrar" @click="close">
            <Icon name="close" />
          </button>
        </header>

        <div class="scroll">
          <section class="caption" @dblclick="post.kind === 'text' && toggleLike()">
            <h1 v-if="post.title">{{ post.title }}</h1>
            <p v-if="post.description" :class="{ tweet: post.kind === 'text' }">
              <template v-for="(part, i) in parts" :key="i">
                <span v-if="part.tag" class="hashtag">{{ part.text }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
            <ul v-if="post.kind === 'image' && tags.length" class="tags">
              <li v-for="t in tags" :key="t">#{{ t }}</li>
            </ul>
          </section>

          <section class="comments">
            <h2>Comentarios</h2>
            <p v-if="!comments.length" class="empty">Todavía no hay comentarios. Escribí el primero.</p>
            <div v-for="(c, i) in comments" :key="c.comment_id || 'nuevo-' + i" class="comment">
              <router-link :to="`/u/${c.user_id}`" @click="close"><Avatar :name="c.username" :src="c.avatar" :size="30" /></router-link>
              <p>
                <router-link :to="`/u/${c.user_id}`" class="cname" @click="close">{{ c.username }}</router-link>
                {{ c.comment }}
                <span v-if="c.created_at" class="ctime">{{ timeAgo(c.created_at) }}</span>
              </p>
            </div>
          </section>
        </div>

        <footer class="panel-foot">
          <button class="like" :class="{ liked }" type="button" :aria-pressed="liked" @click="toggleLike">
            <Icon name="nest" :size="22" :filled="liked" />
            <span>{{ likes }} {{ likes === 1 ? 'hornero' : 'horneros' }}</span>
          </button>
          <form v-if="logged" class="comment-form" @submit.prevent="newComment">
            <input class="input" type="text" placeholder="Escribí un comentario" aria-label="Comentario" maxlength="255" v-model="comment.comment">
            <button class="btn btn-primary" type="submit" :disabled="!comment.comment.trim()">Publicar</button>
          </form>
          <p v-else class="login-hint"><router-link to="/login">Ingresá</router-link> para dar horneros y comentar.</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import { timeAgo } from '@/lib/time'
import { closePost } from '@/lib/modal'

export default {
  components: { Icon, Avatar },
  props: ['id'],
  data() {
    return {
      post: {},
      comments: [],
      burst: false,
      comment: { comment: '' }
    }
  },
  computed: {
    logged() {
      return !!this.$store.getters.token
    },
    liked() {
      return this.$store.getters.isLiked(this.post.post_id)
    },
    likes() {
      return this.post.post_id ? this.$store.getters.likesOf(this.post) : 0
    },
    tags() {
      return (this.post.tags || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    },
    parts() {
      return (this.post.description || '').split(/(#[\p{L}\p{N}_]+)/u).filter(Boolean).map(text => ({ text, tag: this.post.kind === 'text' && text.startsWith('#') && text.length > 1 }))
    }
  },
  created() {
    api.get(`/posts/${this.id}`).then(response => {
      this.post = response.data
      return api.get(`/posts/${this.id}/comments`)
    }).then(comments => {
      this.comments = comments.data
    }).catch(() => {
      // no existe o es de una cuenta privada que no seguis
      this.close()
    })
  },
  mounted() {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', this.onKey)
  },
  unmounted() {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    assetUrl,
    timeAgo,
    onKey(e) {
      if (e.key === 'Escape') this.close()
    },
    close() {
      closePost(this.$router, this.$route)
    },
    // un toque o doble clic: da el hornero, y otro lo saca
    toggleLike() {
      if (!this.logged) {
        this.close()
        this.$router.push('/login')
        return
      }
      this.$store.dispatch('toggleLike', this.post.post_id).then(data => {
        if (data && data.liked && this.post.kind === 'image') {
          this.burst = true
          setTimeout(() => { this.burst = false }, 700)
        }
      })
    },
    newComment() {
      api.post(`/posts/${this.post.post_id}/comments`, { comment: this.comment.comment }).then(response => {
        if (response.data.ok) {
          this.comments.push({
            user_id: this.$store.getters.loggedId,
            username: this.$store.getters.username,
            avatar: this.$store.getters.avatar,
            comment: this.comment.comment.trim(),
            created_at: new Date().toISOString()
          })
          this.post.comment_count = (this.post.comment_count || 0) + 1
          this.comment.comment = ''
        }
      })
    }
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 150; background: rgba(10, 8, 6, 0.6);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal {
  display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, 1fr); grid-template-rows: minmax(0, 1fr);
  width: 100%; max-width: 1080px; height: min(86vh, 720px);
  background: var(--surface); color: var(--ink); border-radius: 20px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}
.modal.text { grid-template-columns: minmax(0, 1fr); max-width: 560px; height: min(80vh, 640px); }
.photo { position: relative; margin: 0; background: #0d0b0a; display: flex; align-items: center; justify-content: center; min-width: 0; user-select: none; }
.photo img { width: 100%; height: 100%; object-fit: contain; }
.burst { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; pointer-events: none; animation: pop 700ms ease-out forwards; filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.4)); }
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 25% { transform: scale(1.15); opacity: 1; } 60% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.05); opacity: 0; } }

.panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.panel-top { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.who { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); color: var(--ink); }
.who:hover { text-decoration: none; opacity: 0.85; }
.when { color: var(--muted); font-size: 15px; margin-right: auto; }
.icon-close { display: inline-flex; width: 38px; height: 38px; align-items: center; justify-content: center; border: none; border-radius: 10px; background: transparent; color: var(--muted); }
.icon-close:hover { background: var(--surface-2); color: var(--ink); }

.scroll { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 24px; }
.caption { display: flex; flex-direction: column; gap: 10px; }
.caption h1 { font-size: 24px; }
.tweet { font-size: 22px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }
.hashtag { color: var(--cielo); font-weight: 500; }
.tags { display: flex; flex-wrap: wrap; gap: 6px 10px; list-style: none; margin: 0; padding: 0; }
.tags li { color: var(--cielo); font-weight: 500; font-size: 16px; }

.comments { display: flex; flex-direction: column; gap: 14px; }
.comments h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; }
.comment { display: flex; gap: 10px; align-items: flex-start; }
.comment p { padding-top: 3px; overflow-wrap: anywhere; }
.cname { font-weight: 700; color: var(--ink); margin-right: 4px; }
.cname:hover { text-decoration: none; opacity: 0.8; }
.ctime { color: var(--muted); font-size: 14px; margin-left: 6px; }
.empty { color: var(--muted); }

.panel-foot { padding: 12px 18px 16px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; }
.like { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px 0 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); font-weight: 700; color: var(--ink); }
.like:hover { background: var(--surface-2); }
.like.liked { background: var(--tint); border-color: transparent; color: var(--accent); }
.comment-form { display: flex; gap: 8px; }
.comment-form .input { min-height: 46px; }
.comment-form .btn { height: 46px; }
.login-hint { color: var(--muted); }

@media (max-width: 720px) {
  .overlay { padding: 0; align-items: stretch; }
  .modal { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 36vh) minmax(0, 1fr); height: 100%; max-width: none; border-radius: 0; }
  .modal.text { grid-template-rows: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) { .burst { animation-duration: 1ms; } }
</style>
