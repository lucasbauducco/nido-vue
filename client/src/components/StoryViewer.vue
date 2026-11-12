<template>
  <div class="viewer" role="dialog" aria-modal="true" aria-label="Historias" @click.self="$emit('close')">
    <div class="stage" @pointerdown="hold" @pointerup="release" @pointerleave="release">
      <img class="photo" :src="assetUrl(story.source)" :alt="`Historia de ${group.username}`" draggable="false">
      <div class="shade"></div>

      <div class="bars" aria-hidden="true">
        <span v-for="(s, i) in group.stories" :key="s.story_id" class="bar">
          <span class="fill" :style="{ width: (i < index ? 100 : i === index ? progress : 0) + '%' }"></span>
        </span>
      </div>

      <header class="top">
        <router-link :to="`/u/${group.user_id}`" class="who" @click="$emit('close')">
          <Avatar :name="group.username" :src="group.avatar" :size="36" />
          <strong>{{ group.username }}</strong>
        </router-link>
        <span class="time">{{ timeAgo(story.created_at) }}</span>
        <span class="left"><Icon name="clock" :size="14" /> {{ storyTimeLeft(story.created_at) }}</span>
        <button v-if="group.isMine" class="icon" type="button" aria-label="Eliminar esta historia" @pointerdown.stop @click.stop="remove"><Icon name="trash" :size="20" /></button>
        <button class="icon" type="button" aria-label="Cerrar" @pointerdown.stop @click.stop="$emit('close')"><Icon name="close" :size="22" /></button>
      </header>

      <button class="zone back" type="button" aria-label="Historia anterior" @click.stop="prev"></button>
      <button class="zone fwd" type="button" aria-label="Historia siguiente" @click.stop="next"></button>
    </div>

    <button class="nav side-prev" type="button" aria-label="Persona anterior" @click.stop="prevGroup"><Icon name="prev" :size="26" /></button>
    <button class="nav side-next" type="button" aria-label="Persona siguiente" @click.stop="nextGroup"><Icon name="next" :size="26" /></button>
  </div>
</template>

<script>
import api, { assetUrl } from '@/api.js'
import Avatar from '@/components/Avatar.vue'
import Icon from '@/components/Icon.vue'
import { timeAgo, storyTimeLeft } from '@/lib/time'

const DURATION = 5000 // milisegundos que dura cada historia
const TICK = 50

export default {
  components: { Avatar, Icon },
  props: {
    groups: { type: Array, required: true },
    start: { type: Number, default: 0 }
  },
  emits: ['close', 'seen', 'deleted'],
  data() {
    return { g: this.start, index: 0, progress: 0, paused: false, timer: null }
  },
  computed: {
    group() {
      return this.groups[this.g]
    },
    story() {
      return this.group.stories[this.index]
    }
  },
  watch: {
    story: {
      immediate: true,
      handler(s) {
        if (s) this.$emit('seen', s.story_id)
      }
    }
  },
  mounted() {
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', this.onKey)
    this.timer = setInterval(this.tick, TICK)
  },
  unmounted() {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', this.onKey)
    clearInterval(this.timer)
  },
  methods: {
    assetUrl,
    timeAgo,
    storyTimeLeft,
    tick() {
      if (this.paused) return
      this.progress += (TICK / DURATION) * 100
      if (this.progress >= 100) this.next()
    },
    hold() { this.paused = true },
    release() { this.paused = false },
    next() {
      this.progress = 0
      if (this.index < this.group.stories.length - 1) this.index++
      else this.nextGroup()
    },
    prev() {
      this.progress = 0
      if (this.index > 0) this.index--
      else this.prevGroup()
    },
    nextGroup() {
      this.progress = 0
      this.index = 0
      if (this.g < this.groups.length - 1) this.g++
      else this.$emit('close')
    },
    prevGroup() {
      this.progress = 0
      this.index = 0
      if (this.g > 0) this.g--
    },
    onKey(e) {
      if (e.key === 'Escape') this.$emit('close')
      else if (e.key === 'ArrowRight') this.next()
      else if (e.key === 'ArrowLeft') this.prev()
    },
    remove() {
      this.paused = true
      api.delete(`/stories/${this.story.story_id}`).then(() => {
        this.$emit('deleted')
        this.$emit('close')
      }).catch(() => {
        this.paused = false
      })
    }
  }
}
</script>

<style scoped>
.viewer { position: fixed; inset: 0; z-index: 300; background: rgba(8, 6, 5, 0.92); display: flex; align-items: center; justify-content: center; }
.stage { position: relative; height: min(92vh, 860px); aspect-ratio: 9 / 16; max-width: 100vw; border-radius: 18px; overflow: hidden; background: #0d0b0a; touch-action: manipulation; }
.photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; user-select: none; }
.shade { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent 24%); pointer-events: none; }

.bars { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; gap: 4px; z-index: 2; }
.bar { flex: 1; height: 3px; border-radius: 2px; background: rgba(255, 255, 255, 0.35); overflow: hidden; }
.fill { display: block; height: 100%; background: #fff; }

.top { position: absolute; top: 22px; left: 12px; right: 8px; display: flex; align-items: center; gap: 8px; color: #fff; z-index: 3; }
.who { display: inline-flex; align-items: center; gap: 8px; color: #fff; font-family: var(--font-display); min-width: 0; }
.who strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who:hover { text-decoration: none; }
.time { font-size: 14px; opacity: 0.85; white-space: nowrap; }
.left { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; opacity: 0.85; white-space: nowrap; }
.icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: none; border-radius: 50%; background: transparent; color: #fff; }
.icon:hover { background: rgba(255, 255, 255, 0.18); }

.zone { position: absolute; top: 70px; bottom: 0; width: 38%; border: none; background: transparent; z-index: 1; }
.zone.back { left: 0; }
.zone.fwd { right: 0; width: 62%; }

.nav { position: absolute; top: 50%; transform: translateY(-50%); display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: none; border-radius: 50%; background: rgba(255, 255, 255, 0.16); color: #fff; }
.nav:hover { background: rgba(255, 255, 255, 0.28); }
.side-prev { left: max(16px, calc(50% - 280px)); }
.side-next { right: max(16px, calc(50% - 280px)); }

@media (max-width: 720px) {
  .stage { height: 100%; width: 100%; aspect-ratio: auto; border-radius: 0; }
  .nav { display: none; }
}
</style>
