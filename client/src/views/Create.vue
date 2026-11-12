<template>
  <main class="create">
    <div class="container">
      <header class="head">
        <h1>Crear</h1>
        <div class="tabs" role="tablist" aria-label="Qué querés crear">
          <button v-for="t in tabs" :key="t.id" role="tab" type="button" :aria-selected="tab === t.id" :class="{ on: tab === t.id }" @click="setTab(t.id)">
            <Icon :name="t.icon" :size="20" /> {{ t.label }}
          </button>
        </div>
      </header>

      <p v-if="error" class="alert" role="alert">{{ error }}</p>

      <!-- foto -->
      <div v-if="tab === 'foto'" class="layout">
        <ImageUpload :key="'foto'" @selected="image = $event" />
        <form @submit.prevent="publishPhoto" novalidate>
          <div class="field">
            <label for="titulo">Título</label>
            <input id="titulo" class="input" type="text" placeholder="Atardecer en la laguna" v-model="titulo" maxlength="120">
          </div>
          <div class="field">
            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" class="input" placeholder="Contá dónde la sacaste o qué significa para vos" v-model="descripcion"></textarea>
          </div>
          <div class="field">
            <label for="tags">Etiquetas</label>
            <input id="tags" class="input" type="text" placeholder="paisaje, pampa, atardecer" v-model="tags">
            <small>Separadas por comas.</small>
          </div>
          <button class="btn btn-primary btn-block" type="submit" :disabled="!image || !titulo.trim() || loading">{{ loading ? 'Publicando...' : 'Publicar foto' }}</button>
        </form>
      </div>

      <!-- texto -->
      <form v-else-if="tab === 'texto'" class="text-form" @submit.prevent="publishText" novalidate>
        <div class="field">
          <label for="texto">Tu publicación</label>
          <textarea id="texto" class="input big" v-model="texto" maxlength="280" placeholder="Escribí lo que quieras compartir. Los #hashtags se convierten en etiquetas."></textarea>
          <small class="count" :class="{ near: 280 - texto.length <= 20 }">{{ 280 - texto.length }} caracteres restantes</small>
        </div>
        <button class="btn btn-primary" type="submit" :disabled="!texto.trim() || loading">{{ loading ? 'Publicando...' : 'Publicar texto' }}</button>
      </form>

      <!-- historia -->
      <div v-else class="story">
        <ImageUpload :key="'historia'" ratio="9 / 16" @selected="image = $event" />
        <div class="story-side">
          <h2>Una historia dura 24 horas</h2>
          <p>Después se borra sola. La ven quienes pueden ver tu perfil y aparece arriba del inicio.</p>
          <button class="btn btn-primary" type="button" :disabled="!image || loading" @click="publishStory">{{ loading ? 'Publicando...' : 'Compartir historia' }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import api from '@/api.js'
import ImageUpload from '@/components/ImageUpload.vue'
import Icon from '@/components/Icon.vue'

const TABS = [
  { id: 'foto', label: 'Foto', icon: 'image' },
  { id: 'texto', label: 'Texto', icon: 'text' },
  { id: 'historia', label: 'Historia', icon: 'clock' }
]

export default {
  components: { ImageUpload, Icon },
  data() {
    return {
      tabs: TABS,
      tab: TABS.some(t => t.id === this.$route.query.tab) ? this.$route.query.tab : 'foto',
      titulo: '',
      tags: '',
      descripcion: '',
      texto: '',
      image: '',
      error: '',
      loading: false
    }
  },
  methods: {
    setTab(id) {
      this.tab = id
      this.image = ''
      this.error = ''
      this.$router.replace({ path: '/create', query: { tab: id } })
    },
    send(request, done) {
      this.error = ''
      this.loading = true
      request.then(r => {
        if (r.data.ok) done(r.data)
      }).catch(e => {
        this.error = (e.response && e.response.data && e.response.data.error) || 'No pudimos publicar. Revisá tu conexión e intentá de nuevo.'
      }).finally(() => {
        this.loading = false
      })
    },
    publishPhoto() {
      if (!this.image || !this.titulo.trim() || this.loading) return
      const formData = new FormData()
      formData.set('title', this.titulo.trim())
      formData.set('tags', this.tags)
      formData.set('description', this.descripcion)
      formData.append('source', this.image)
      this.send(api.post('/posts', formData, { headers: { 'content-type': 'multipart/form-data' }, timeout: 60000 }), () => this.$router.push('/'))
    },
    publishText() {
      if (!this.texto.trim() || this.loading) return
      this.send(api.post('/posts/text', { text: this.texto }), () => this.$router.push('/'))
    },
    publishStory() {
      if (!this.image || this.loading) return
      const formData = new FormData()
      formData.append('source', this.image)
      this.send(api.post('/stories', formData, { headers: { 'content-type': 'multipart/form-data' }, timeout: 60000 }), () => this.$router.push('/'))
    }
  }
}
</script>

<style scoped>
.create { padding: 28px 0 56px; }
.head { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabs button { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 15px; }
.tabs button.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.layout { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 36px; align-items: start; max-width: 960px; }
.text-form { max-width: 640px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.text-form .field { width: 100%; }
.big { min-height: 180px; font-size: 20px; }
small { color: var(--muted); font-size: 15px; }
.count.near { color: var(--accent); font-weight: 700; }
.story { display: grid; grid-template-columns: minmax(0, 300px) minmax(0, 1fr); gap: 36px; align-items: start; max-width: 760px; }
.story-side { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.story-side p { color: var(--muted); max-width: 42ch; }
.alert { max-width: 640px; }

@media (max-width: 720px) {
  .create { padding-top: 16px; }
  .layout, .story { grid-template-columns: minmax(0, 1fr); gap: 24px; }
}
</style>
