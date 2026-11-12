<template>
  <div class="shell">
    <!-- barra lateral (escritorio y tablet) -->
    <aside v-if="showChrome" class="sidebar" aria-label="Navegación principal">
      <router-link to="/" class="brand" aria-label="Nido, inicio">
        <NidoLogo class="brand-full" />
        <NidoLogo mark-only class="brand-mark" />
      </router-link>

      <nav class="links">
        <router-link to="/" exact-active-class="active" class="link"><Icon name="home" :size="26" /><span>Inicio</span></router-link>
        <router-link to="/explore" active-class="active" class="link"><Icon name="search" :size="26" /><span>Explorar</span></router-link>
        <router-link v-if="logged" to="/create" active-class="active" class="link"><Icon name="plus" :size="26" /><span>Crear</span></router-link>
        <router-link v-if="logged" :to="`/u/${userId}`" active-class="active" class="link">
          <Avatar :name="username" :src="avatar" :size="26" /><span>Perfil</span>
        </router-link>
      </nav>

      <div class="bottom">
        <router-link v-if="logged" to="/settings" active-class="active" class="link"><Icon name="settings" :size="26" /><span>Configuración</span></router-link>
        <button class="link" type="button" :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme">
          <Icon :name="isDark ? 'sun' : 'moon'" :size="26" /><span>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</span>
        </button>
        <button v-if="logged" class="link" type="button" @click="logout"><Icon name="logout" :size="26" /><span>Salir</span></button>
        <router-link v-else class="btn btn-primary login-btn" to="/login"><span>Ingresar</span></router-link>
      </div>
    </aside>

    <!-- barra superior (celular) -->
    <header v-if="showChrome" class="topbar">
      <router-link to="/" class="brand-sm" aria-label="Nido, inicio"><NidoLogo /></router-link>
      <div class="top-actions">
        <button class="icon-btn" type="button" :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" @click="toggleTheme">
          <Icon :name="isDark ? 'sun' : 'moon'" />
        </button>
        <router-link v-if="logged" class="icon-btn" to="/settings" aria-label="Configuración"><Icon name="settings" /></router-link>
        <router-link v-else class="btn btn-primary btn-sm" to="/login">Ingresar</router-link>
      </div>
    </header>

    <div class="content">
      <router-view />
    </div>

    <!-- navegación inferior (celular) -->
    <nav v-if="showChrome" class="tabbar" aria-label="Navegación">
      <router-link to="/" exact-active-class="active" aria-label="Inicio"><Icon name="home" :size="26" /></router-link>
      <router-link to="/explore" active-class="active" aria-label="Explorar"><Icon name="search" :size="26" /></router-link>
      <router-link v-if="logged" to="/create" active-class="active" aria-label="Crear"><Icon name="plus" :size="26" /></router-link>
      <router-link v-if="logged" :to="`/u/${userId}`" active-class="active" aria-label="Perfil"><Avatar :name="username" :src="avatar" :size="28" /></router-link>
      <router-link v-else to="/login" active-class="active" aria-label="Ingresar"><Icon name="user" :size="26" /></router-link>
    </nav>

    <PostModal v-if="postId" :key="postId" :id="postId" />
  </div>
</template>

<script>
import NidoLogo from '@/components/NidoLogo.vue'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import PostModal from '@/views/Post.vue'

const THEME_KEY = 'nido-theme'

export default {
  components: { NidoLogo, Icon, Avatar, PostModal },
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
    // los "me gusta" no se guardan en el navegador: se piden al abrir la app
    this.$store.dispatch('loadLikes')
  },
  computed: {
    showChrome() {
      return !['/login', '/register'].includes(this.$route.path)
    },
    // publicacion abierta: la direccion es ?post=ID
    postId() {
      const id = parseInt(this.$route.query.post, 10)
      return id > 0 ? id : null
    },
    logged() {
      return !!this.$store.getters.token
    },
    userId() {
      return this.$store.getters.loggedId
    },
    username() {
      return this.$store.getters.username || ''
    },
    avatar() {
      return this.$store.getters.avatar
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
.shell { min-height: 100vh; }

/* ---- barra lateral ---- */
.sidebar {
  position: fixed; top: 0; bottom: 0; left: 0; width: 244px; z-index: 100;
  display: flex; flex-direction: column; gap: 8px; padding: 22px 12px 18px;
  background: var(--surface); border-right: 1px solid var(--line);
}
.brand { display: flex; align-items: center; padding: 4px 12px 18px; font-size: 24px; }
.brand:hover { text-decoration: none; }
.brand-mark { display: none; }
.links { display: flex; flex-direction: column; gap: 4px; }
.bottom { margin-top: auto; display: flex; flex-direction: column; gap: 4px; }
.link {
  display: flex; align-items: center; gap: 14px; height: 50px; padding: 0 12px; width: 100%;
  border: none; border-radius: 12px; background: transparent; color: var(--ink);
  font-family: var(--font-body); font-size: 18px; font-weight: 500; text-align: left;
}
.link:hover { background: var(--surface-2); text-decoration: none; }
.link.active { font-weight: 800; }
.link.active :deep(.icon) { color: var(--accent); }
.login-btn { margin: 6px 4px 0; width: auto; }

.content { margin-left: 244px; min-height: 100vh; }

.topbar, .tabbar { display: none; }

/* ---- tablet: solo iconos ---- */
@media (max-width: 1100px) and (min-width: 721px) {
  .sidebar { width: 76px; align-items: center; padding-inline: 8px; }
  .brand-full { display: none; }
  .brand-mark { display: inline-flex; font-size: 22px; }
  .brand { padding-inline: 0; }
  .link { width: 52px; justify-content: center; padding: 0; }
  .link span { display: none; }
  .login-btn { width: 52px; padding: 0; font-size: 12px; margin: 6px 0 0; }
  .content { margin-left: 76px; }
}

/* ---- celular ---- */
@media (max-width: 720px) {
  .sidebar { display: none; }
  .content { margin-left: 0; padding-bottom: 66px; }
  .topbar {
    display: flex; position: sticky; top: 0; z-index: 100; height: 56px; padding: 0 16px;
    align-items: center; justify-content: space-between;
    background: color-mix(in srgb, var(--surface) 90%, transparent); backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .brand-sm { font-size: 20px; }
  .brand-sm:hover { text-decoration: none; }
  .top-actions { display: flex; align-items: center; gap: 4px; }
  .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px; border: none; background: transparent; color: var(--ink); }
  .icon-btn:hover { background: var(--surface-2); text-decoration: none; }
  .tabbar {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
    background: var(--surface); border-top: 1px solid var(--line);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom, 0px));
  }
  .tabbar a { flex: 1; display: flex; align-items: center; justify-content: center; height: 46px; color: var(--muted); border-radius: 12px; }
  .tabbar a.active { color: var(--accent); }
}
</style>
