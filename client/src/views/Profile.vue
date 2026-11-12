<template>
  <main class="profile">
    <div class="container">
      <section class="card">
        <Avatar :name="username" :size="88" />
        <div class="info">
          <h1>{{ username || 'Mi perfil' }}</h1>
          <p class="email">{{ email }}</p>
        </div>
        <div class="actions">
          <router-link class="btn btn-primary" to="/upload">Nueva publicación</router-link>
          <button class="btn btn-secondary" type="button" @click="logout">Salir</button>
        </div>
      </section>
    </div>
  </main>
</template>

<script>
import api from '@/api.js'
import Avatar from '@/components/Avatar.vue'

export default {
  components: { Avatar },
  data() {
    return {
      email: ''
    }
  },
  computed: {
    username() {
      return this.$store.getters.username || ''
    }
  },
  created() {
    api.get('/users/profile').then(response => {
      this.email = response.data.email
      if (response.data.username) this.$store.commit('setUsername', response.data.username)
    })
  },
  methods: {
    logout() {
      this.$store.commit('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.profile { min-height: calc(100vh - 64px); padding: 32px 0 56px; }
.card {
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  background: var(--surface); border: 1px solid var(--line); border-radius: 20px; padding: 28px;
}
.info { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 4px; }
.email { color: var(--muted); }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }

@media (max-width: 720px) {
  .profile { padding-top: 20px; }
  .card { padding: 20px; }
}
</style>
