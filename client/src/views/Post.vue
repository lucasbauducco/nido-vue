<template>
  <div class="overlay" @click="close">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="post.title || 'Publicación'" @click.stop>
      <figure class="photo">
        <img v-if="post.source" :src="assetUrl(post.source)" :alt="post.title">
      </figure>

      <div class="panel">
        <header class="panel-top">
          <div class="who">
            <Avatar :name="user.username" :size="38" />
            <strong>{{ user.username }}</strong>
          </div>
          <button class="icon-close" type="button" aria-label="Cerrar" @click="close">
            <Icon name="close" />
          </button>
        </header>

        <div class="scroll">
          <section class="caption">
            <h1>{{ post.title }}</h1>
            <p v-if="post.description">{{ post.description }}</p>
            <ul v-if="tags.length" class="tags">
              <li v-for="t in tags" :key="t">#{{ t }}</li>
            </ul>
          </section>

          <section class="comments">
            <h2>Comentarios</h2>
            <p v-if="!comments.length" class="empty">Todavía no hay comentarios. Escribí el primero.</p>
            <div v-for="(c, i) in comments" :key="c.comment_id || 'nuevo-' + i" class="comment">
              <Avatar :name="c.username" :size="30" />
              <p><strong>{{ c.username }}</strong> {{ c.comment }}</p>
            </div>
          </section>
        </div>

        <footer class="panel-foot">
          <button class="like" :class="{ liked }" type="button" @click="likePost">
            <Icon name="nest" :size="22" :filled="liked" />
            <span>{{ post.likes }} {{ post.likes === 1 ? 'hornero' : 'horneros' }}</span>
          </button>
          <form v-if="logged" class="comment-form" @submit.prevent="newComment">
            <input class="input" type="text" placeholder="Escribí un comentario" aria-label="Comentario" v-model="comment.comment">
            <button class="btn btn-primary" type="submit" :disabled="!comment.comment.trim()">Publicar</button>
          </form>
          <p v-else class="login-hint"><router-link to="/login">Ingresá</router-link> para dar me gusta y comentar.</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'

export default {
  components: { Icon, Avatar },
  props: ['id'],
  data() {
    return {
      postLikes: [],
      post: {},
      user: {},
      comments: [],
      comment: {
        userId: null,
        postId: null,
        username: null,
        comment: ''
      }
    }
  },
  computed: {
    logged() {
      return !!this.$store.getters.token
    },
    liked() {
      return this.postLikes.includes(this.post.post_id)
    },
    tags() {
      return (this.post.tags || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    }
  },
  created() {
    this.comment.userId = this.$store.getters.loggedId
    this.comment.postId = this.id
    this.comment.username = this.$store.getters.username

    // traemos el post, despues su autor y sus comentarios
    api.get(`/posts/${this.id}`).then(response => {
      this.post = response.data
      return api.get(`/users/${this.post.user_id}`)
    }).then(user => {
      this.user = user.data
      return api.get(`/posts/${this.id}/comments`)
    }).then(comments => {
      this.comments = comments.data
    }).catch(() => {
      this.close()
    })

    if (this.logged) {
      api.get('/posts/likes').then(response => {
        this.postLikes = response.data
      })
    }
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
    onKey(e) {
      if (e.key === 'Escape') this.close()
    },
    close() {
      this.$router.push('/')
    },
    likePost() {
      if (!this.logged) {
        this.$router.push('/login')
        return
      }
      if (this.liked) return

      api.post(`/posts/like/${this.post.post_id}`).then(response => {
        if (response.data.ok) {
          this.post.likes++
          this.postLikes.push(this.post.post_id)
        }
      })
    },
    newComment() {
      api.post(`/posts/${this.comment.postId}/comments`, this.comment).then(response => {
        if (response.data.ok) {
          this.comments.push(Object.assign({}, this.comment))
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
.photo { margin: 0; background: #0d0b0a; display: flex; align-items: center; justify-content: center; min-width: 0; }
.photo img { width: 100%; height: 100%; object-fit: contain; }

.panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.panel-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.who { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); }
.icon-close { display: inline-flex; width: 38px; height: 38px; align-items: center; justify-content: center; border: none; border-radius: 10px; background: transparent; color: var(--muted); }
.icon-close:hover { background: var(--surface-2); color: var(--ink); }

.scroll { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 24px; }
.caption { display: flex; flex-direction: column; gap: 10px; }
.caption h1 { font-size: 24px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px 10px; list-style: none; margin: 0; padding: 0; }
.tags li { color: var(--cielo); font-weight: 500; font-size: 16px; }

.comments { display: flex; flex-direction: column; gap: 14px; }
.comments h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; }
.comment { display: flex; gap: 10px; align-items: flex-start; }
.comment p { padding-top: 3px; overflow-wrap: anywhere; }
.comment strong { font-weight: 700; margin-right: 4px; }
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
}
</style>
