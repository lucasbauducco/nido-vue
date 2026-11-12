<template>
  <article class="card" :class="post.kind" @dblclick="toggleLike">
    <header class="head">
      <router-link :to="`/u/${post.user_id}`" class="who" :aria-label="`Perfil de ${post.username}`">
        <Avatar :name="post.username" :src="post.avatar" :size="38" />
      </router-link>
      <div class="meta">
        <router-link :to="`/u/${post.user_id}`" class="name">{{ post.username }}</router-link>
        <span class="time">{{ timeAgo(post.created_at) }}</span>
      </div>
      <button v-if="mine" class="trash" type="button" :class="{ sure: confirming }" :aria-label="confirming ? 'Confirmar eliminación' : 'Eliminar publicación'" @click.stop="remove" @blur="confirming = false">
        <Icon name="trash" :size="18" />
        <span v-if="confirming">Eliminar</span>
      </button>
    </header>

    <!-- foto (estilo Instagram) -->
    <div v-if="post.kind === 'image'" class="media">
      <img :src="assetUrl(post.source)" :alt="post.title || `Foto de ${post.username}`" loading="lazy" draggable="false">
      <span v-if="burst" class="burst" aria-hidden="true"><Icon name="nest" :size="96" filled /></span>
    </div>

    <!-- texto (estilo Twitter) -->
    <p v-else class="body">
      <template v-for="(part, i) in parts" :key="i">
        <span v-if="part.tag" class="hashtag">{{ part.text }}</span>
        <template v-else>{{ part.text }}</template>
      </template>
      <span v-if="burst" class="burst small" aria-hidden="true"><Icon name="nest" :size="56" filled /></span>
    </p>

    <div class="actions">
      <button class="act like" :class="{ liked }" type="button" :aria-pressed="liked" :aria-label="liked ? 'Quitar hornero' : 'Dar hornero'" @click.stop="toggleLike">
        <Icon name="nest" :size="26" :filled="liked" />
        <span v-if="post.kind === 'text'">{{ likes }}</span>
      </button>
      <button class="act" type="button" aria-label="Ver comentarios" @click.stop="open">
        <Icon name="comment" :size="25" />
        <span v-if="post.kind === 'text'">{{ post.comment_count }}</span>
      </button>
    </div>

    <template v-if="post.kind === 'image'">
      <p class="likes">{{ likes }} {{ likes === 1 ? 'hornero' : 'horneros' }}</p>
      <p v-if="post.title || post.description" class="caption">
        <router-link :to="`/u/${post.user_id}`" class="name">{{ post.username }}</router-link>
        <strong v-if="post.title">{{ post.title }}</strong> {{ post.description }}
      </p>
      <p v-if="tags.length" class="tags"><span v-for="t in tags" :key="t" class="hashtag">#{{ t }}</span></p>
      <button class="more" type="button" @click.stop="open">
        {{ post.comment_count ? `Ver los ${post.comment_count} comentarios` : 'Agregar un comentario' }}
      </button>
    </template>
  </article>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import { timeAgo } from '@/lib/time'
import { openPost } from '@/lib/modal'

export default {
  components: { Icon, Avatar },
  props: {
    post: { type: Object, required: true }
  },
  emits: ['deleted'],
  data() {
    return { burst: false, confirming: false, busy: false }
  },
  computed: {
    mine() {
      return !!this.$store.getters.token && this.$store.getters.loggedId === this.post.user_id
    },
    liked() {
      return this.$store.getters.isLiked(this.post.post_id)
    },
    likes() {
      return this.$store.getters.likesOf(this.post)
    },
    tags() {
      return (this.post.tags || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    },
    // el texto separado en partes para resaltar los #hashtags sin usar v-html
    parts() {
      return (this.post.description || '').split(/(#[\p{L}\p{N}_]+)/u).filter(Boolean).map(text => ({ text, tag: text.startsWith('#') && text.length > 1 }))
    }
  },
  methods: {
    assetUrl,
    timeAgo,
    open() {
      openPost(this.$router, this.$route, this.post.post_id)
    },
    // doble clic o toque en el hornero: lo da, y otro doble clic lo saca
    toggleLike() {
      const sel = window.getSelection && window.getSelection()
      if (sel) sel.removeAllRanges()

      if (!this.$store.getters.token) {
        this.$router.push('/login')
        return
      }
      if (this.busy) return
      this.busy = true
      this.$store.dispatch('toggleLike', this.post.post_id).then(data => {
        if (data && data.liked) {
          this.burst = true
          setTimeout(() => { this.burst = false }, 700)
        }
      }).finally(() => {
        this.busy = false
      })
    },
    remove() {
      if (!this.confirming) {
        this.confirming = true
        return
      }
      api.delete(`/posts/${this.post.post_id}`).then(() => {
        this.$emit('deleted', this.post.post_id)
      })
    }
  }
}
</script>

<style scoped>
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding-bottom: 6px; overflow: hidden; }
.card.text { padding-bottom: 4px; }
.head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; }
.who { display: inline-flex; }
.meta { display: flex; align-items: baseline; gap: 8px; min-width: 0; flex: 1; }
.name { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name:hover { text-decoration: none; opacity: 0.8; }
.time { color: var(--muted); font-size: 15px; white-space: nowrap; }
.trash { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 9px; border: none; border-radius: 10px; background: transparent; color: var(--muted); font-weight: 600; }
.trash:hover { background: var(--surface-2); color: var(--ink); }
.trash.sure { background: color-mix(in srgb, #D64545 16%, var(--surface)); color: #D64545; }

.media { position: relative; background: var(--surface-2); user-select: none; -webkit-user-select: none; }
.media img { width: 100%; max-height: 640px; object-fit: cover; display: block; }
.body { position: relative; padding: 4px 16px 10px; font-size: 21px; line-height: 1.4; overflow-wrap: anywhere; white-space: pre-wrap; }
.hashtag { color: var(--cielo); font-weight: 500; }

.burst { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; pointer-events: none; animation: pop 700ms ease-out forwards; filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.4)); }
.burst.small { inset: auto 16px 4px auto; color: var(--accent); filter: none; }
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 25% { transform: scale(1.15); opacity: 1; } 60% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.05); opacity: 0; } }

.actions { display: flex; align-items: center; gap: 6px; padding: 8px 8px 0; }
.act { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 10px; border: none; border-radius: 12px; background: transparent; color: var(--ink); font-weight: 700; }
.act:hover { background: var(--surface-2); }
.act.like.liked { color: var(--accent); }
.likes { padding: 2px 16px 0; font-weight: 700; }
.caption { padding: 4px 16px 0; overflow-wrap: anywhere; }
.caption .name { margin-right: 6px; }
.caption strong { font-weight: 700; margin-right: 4px; }
.tags { padding: 2px 16px 0; display: flex; flex-wrap: wrap; gap: 4px 10px; }
.more { display: block; padding: 6px 16px 8px; border: none; background: transparent; color: var(--muted); font-size: 16px; }
.more:hover { color: var(--ink); }

@media (prefers-reduced-motion: reduce) { .burst { animation-duration: 1ms; } }
</style>
