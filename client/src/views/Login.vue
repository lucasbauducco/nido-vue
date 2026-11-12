<template>
  <AuthLayout title="Entrá a tu nido" subtitle="Ingresá con tu email y tu contraseña.">
    <form @submit.prevent="login" novalidate>
      <p v-if="error" class="alert" role="alert">{{ error }}</p>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="email" required placeholder="vos@ejemplo.com">
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required placeholder="Tu contraseña">
      </div>

      <button class="btn btn-primary btn-block" type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>

    <template #alt>
      ¿No tenés cuenta? <router-link to="/register">Creá una</router-link>
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
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    login() {
      if (!this.email || !this.password) {
        this.error = 'Completá el email y la contraseña.'
        return
      }
      this.error = ''
      this.loading = true
      api.post('/users/login', {
        email: this.email,
        password: this.password
      }).then(result => {
        if (result.data.error) {
          this.error = result.data.error
          return
        }
        if (result.data.token) {
          this.$store.commit('setToken', result.data.token)
          this.$store.commit('setId', result.data.id)
          this.$store.commit('setUsername', result.data.username)
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
