<template>
  <div class="app">
    <header v-if="showChrome" class="topbar">
      <div class="topbar-inner">
        <router-link to="/" class="brand" aria-label="Nido, inicio">
          <NidoLogo />
        </router-link>

        <nav class="actions" aria-label="Principal">
          <button class="icon-btn" type="button" :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme">
            <Icon :name="isDark ? 'sun' : 'moon'" />
          </button>
          <template v-if="logged">
            <router-link class="icon-btn desktop-only" to="/upload" aria-label="Nueva publicación">
              <Icon name="plus" />
            </router-link>
            <router-link class="icon-btn desktop-only" to="/profile" aria-label="Mi perfil">
              <Avatar :name="username" :size="32" />
            </router-link>
            <button class="icon-btn desktop-only" type="button" aria-label="Salir" @click="logout">
              <Icon name="logout" />
            </button>
          </template>
          <router-link v-else class="btn btn-primary btn-sm" to="/login">Ingresar</router-link>
        </nav>
      </div>
    </header>

    <router-view />

    <nav v-if="showChrome && logged" class="tabbar" aria-label="Navegación">
      <router-link to="/" exact-active-class="active" aria-label="Inicio"><Icon name="home" :size="26" /></router-link>
      <router-link to="/upload" active-class="active" aria-label="Publicar"><Icon name="plus" :size="26" /></router-link>
      <router-link to="/profile" active-class="active" aria-label="Perfil"><Icon name="user" :size="26" /></router-link>
    </nav>
  </div>
</template>

<script>
import NidoLogo from '@/components/NidoLogo.vue'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'

const THEME_KEY = 'nido-theme'

export default {
  components: { NidoLogo, Icon, Avatar },
  data() {
    return { theme: null }
  },
  created() {
    try {
      this.theme = localStorage.getItem(THEME_KEY)
    } catch (e) {
      this.theme = null
    }
    if (this.theme) document.documentElement.dataset.theme = this.theme
  },
  computed: {
    showChrome() {
      return !['/login', '/register'].includes(this.$route.path)
    },
    logged() {
      return !!this.$store.getters.token
    },
    username() {
      return this.$store.getters.username || ''
    },
    isDark() {
      if (this.theme) return this.theme === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  },
  methods: {
    toggleTheme() {
      this.theme = this.isDark ? 'light' : 'dark'
      document.documentElement.dataset.theme = this.theme
      try {
        localStorage.setItem(THEME_KEY, this.theme)
      } catch (e) {
        // sin almacenamiento: el cambio vale solo para esta visita
      }
    },
    logout() {
      this.$store.commit('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.topbar {
  position: sticky; top: 0; z-index: 100;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.topbar-inner {
  max-width: 1160px; margin: 0 auto; padding: 0 20px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
}
.brand { font-size: 22px; }
.brand:hover { text-decoration: none; }
.actions { display: flex; align-items: center; gap: 4px; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; border-radius: 12px; border: none; background: transparent;
  color: var(--ink);
}
.icon-btn:hover { background: var(--surface-2); text-decoration: none; }

.tabbar { display: none; }

@media (max-width: 720px) {
  .desktop-only { display: none; }
  .tabbar {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
    background: var(--surface); border-top: 1px solid var(--line);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom, 0px));
  }
  .tabbar a {
    flex: 1; display: flex; align-items: center; justify-content: center;
    height: 46px; color: var(--muted); border-radius: 12px;
  }
  .tabbar a.active { color: var(--accent); }
  .app { padding-bottom: 66px; }
}
</style>
