<template>
  <main class="upload">
    <div class="container">
      <header class="head">
        <h1>Nueva <em>publicación</em></h1>
        <p>Elegí una foto y contá su historia.</p>
      </header>

      <div class="layout">
        <ImageUpload @selected="image = $event" />

        <form @submit.prevent="publish" novalidate>
          <p v-if="error" class="alert" role="alert">{{ error }}</p>

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

          <button class="btn btn-primary btn-block" type="submit" :disabled="!canPublish">
            {{ loading ? 'Publicando...' : 'Publicar ahora' }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<script>
import ImageUpload from '@/components/ImageUpload.vue'
import api from '@/api.js'

export default {
  components: { ImageUpload },
  data() {
    return {
      titulo: '',
      tags: '',
      descripcion: '',
      image: '',
      error: '',
      loading: false
    }
  },
  computed: {
    canPublish() {
      return !!this.image && !!this.titulo.trim() && !this.loading
    }
  },
  methods: {
    publish() {
      if (!this.canPublish) return
      this.error = ''
      this.loading = true

      const formData = new FormData()
      formData.set('title', this.titulo.trim())
      formData.set('tags', this.tags)
      formData.set('description', this.descripcion)
      formData.append('source', this.image)

      api.post('/posts', formData, {
        headers: { 'content-type': 'multipart/form-data' },
        timeout: 60000
      }).then(result => {
        if (result.data.ok) this.$router.push('/')
      }).catch(() => {
        this.error = 'No pudimos publicar la foto. Revisá tu conexión e intentá de nuevo.'
      }).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>

<style scoped>
.upload { min-height: calc(100vh - 64px); padding: 32px 0 56px; }
.head { margin-bottom: 28px; display: flex; flex-direction: column; gap: 4px; }
.head h1 em { font-style: normal; color: var(--accent); }
.head p { color: var(--muted); }
.layout { display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 36px; align-items: start; max-width: 960px; }
small { color: var(--muted); font-size: 15px; }

@media (max-width: 720px) {
  .upload { padding-top: 20px; }
  .layout { grid-template-columns: minmax(0, 1fr); gap: 24px; }
  h1 { font-size: 28px; }
}
</style>
