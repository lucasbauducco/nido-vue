<template>
  <div class="drop" :class="{ over, filled: !!image }">
    <input id="imageFile" ref="file" type="file" accept="image/*" @change="selectFile">
    <label
      for="imageFile"
      @dragenter.stop.prevent="over = true"
      @dragover.stop.prevent="over = true"
      @dragleave.stop.prevent="over = false"
      @drop="loadImage"
    >
      <img v-if="image" :src="image" alt="Vista previa de la imagen elegida">
      <span v-else class="hint">
        <Icon name="upload" :size="40" />
        <strong>Arrastrá una imagen o hacé clic</strong>
        <small>JPG, PNG o WebP</small>
      </span>
    </label>
    <button v-if="image" class="remove" type="button" @click="clear">Quitar imagen</button>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue'

export default {
  components: { Icon },
  data() {
    return {
      image: '',
      over: false
    }
  },
  methods: {
    preview(file) {
      if (!file || !file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        this.image = reader.result
        this.$emit('selected', file)
      })
      reader.readAsDataURL(file)
    },
    loadImage(e) {
      e.stopPropagation()
      e.preventDefault()
      this.over = false
      this.preview(e.dataTransfer.files[0])
    },
    selectFile(e) {
      this.preview(e.target.files[0])
    },
    clear() {
      this.image = ''
      this.$refs.file.value = ''
      this.$emit('selected', '')
    }
  }
}
</script>

<style scoped>
.drop { display: flex; flex-direction: column; gap: 10px; }
input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
label {
  display: flex; align-items: center; justify-content: center;
  aspect-ratio: 1; width: 100%; border-radius: 18px; overflow: hidden; cursor: pointer;
  border: 2px dashed var(--line); background: var(--surface); transition: border-color 120ms, background 120ms;
}
label:hover, .over label { border-color: var(--accent); background: var(--tint); }
.filled label { border-style: solid; }
input:focus-visible + label { outline: 2px solid var(--accent); outline-offset: 2px; }
label img { width: 100%; height: 100%; object-fit: cover; }
.hint { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; color: var(--muted); padding: 20px; }
.hint strong { color: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.hint small { font-size: 15px; }
.remove { align-self: flex-start; border: none; background: transparent; color: var(--muted); text-decoration: underline; padding: 4px 0; }
.remove:hover { color: var(--ink); }
</style>
