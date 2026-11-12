<template>
  <AuthLayout title="Creá tu nido" subtitle="Registrate para publicar fotos y compartirlas.">
    <form @submit.prevent="register" novalidate>
      <p v-if="error" class="alert" role="alert">{{ error }}</p>

      <div class="field">
        <label for="username">Nombre de usuario</label>
        <input id="username" v-model="username" class="input" type="text" autocomplete="username" required placeholder="valeria.sierra" maxlength="30">
        <small>Entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.</small>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required placeholder="vos@ejemplo.com">
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="new-password" required placeholder="Al menos 6 caracteres">
      </div>
      <div class="field">
        <label for="password2">Repetí la contraseña</label>
        <input id="password2" v-model="password2" class="input" type="password" autocomplete="new-password" required placeholder="Repetí la contraseña">
      </div>

      <button class="btn btn-primary btn-block" type="submit" :disabled="loading">
        {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
      </button>
    </form>

    <template #alt>
      ¿Ya tenés cuenta? <router-link to="/login">Ingresá</router-link>
    </template>
  </AuthLayout>
</template>

<script>
import api from '@/api'
import AuthLayout from '@/components/AuthLayout.vue'

export default {
  components: { AuthLayout },
  data() {
    return {
      email: '',
      username: '',
      password: '',
      password2: '',
      error: '',
      loading: false
    }
  },
  methods: {
    register() {
      if (!this.username.trim() || !this.email.trim() || !this.password) {
        this.error = 'Completá todos los campos.'
        return
      }
      if (!/^[A-Za-z0-9._]{3,30}$/.test(this.username.trim())) {
        this.error = 'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.'
        return
      }
      if (this.password.length < 6) {
        this.error = 'La contraseña debe tener al menos 6 caracteres.'
        return
      }
      if (this.password !== this.password2) {
        this.error = 'Las contraseñas no son iguales.'
        return
      }
      this.error = ''
      this.loading = true
      api.post('/users/register', {
        email: this.email.trim(),
        password: this.password,
        username: this.username.trim()
      }).then(result => {
        if (result.data.error) {
          this.error = result.data.error
          return
        }
        if (result.data.token) {
          this.$store.dispatch('login', result.data)
          this.$router.push('/')
        }
      }).catch(() => {
        this.error = 'No pudimos conectar con el servidor. Intentá de nuevo en unos segundos.'
      }).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>

<style scoped>
small { color: var(--muted); font-size: 15px; }
</style>
