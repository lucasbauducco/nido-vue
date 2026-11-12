<template>
  <main class="auth">
    <aside class="art">
      <img src="@/assets/img/banner.jpg" alt="">
      <div class="veil"></div>
      <div class="art-text">
        <router-link to="/" aria-label="Nido, inicio"><NidoLogo light class="art-logo" /></router-link>
        <p>Tu galería, tu nido.</p>
      </div>
    </aside>

    <section class="panel">
      <div class="card">
        <router-link to="/" class="mobile-logo" aria-label="Nido, inicio"><NidoLogo /></router-link>
        <h1>{{ title }}</h1>
        <p class="sub">{{ subtitle }}</p>
        <slot />
        <p class="alt"><slot name="alt" /></p>
      </div>
    </section>
  </main>
</template>

<script>
import NidoLogo from '@/components/NidoLogo.vue'

export default {
  components: { NidoLogo },
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' }
  }
}
</script>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
.art { position: relative; overflow: hidden; }
.art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.veil { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(36, 28, 23, 0.25), rgba(36, 28, 23, 0.8)); }
.art-text { position: absolute; left: 40px; right: 40px; bottom: 40px; display: flex; flex-direction: column; gap: 14px; color: #fff; }
.art-text a:hover { text-decoration: none; }
.art-logo { font-size: 30px; }
.art-text p { font-family: var(--font-display); font-weight: 700; font-size: 34px; letter-spacing: -0.02em; line-height: 1.1; }

.panel { display: flex; align-items: center; justify-content: center; padding: 32px 20px; }
.card { width: 100%; max-width: 380px; }
.mobile-logo { display: none; font-size: 22px; margin-bottom: 28px; }
.mobile-logo:hover { text-decoration: none; }
.card h1 { font-size: 32px; margin-bottom: 6px; }
.sub { color: var(--muted); margin-bottom: 26px; }
.alt { text-align: center; margin-top: 22px; color: var(--muted); }

@media (max-width: 820px) {
  .auth { grid-template-columns: minmax(0, 1fr); }
  .art { display: none; }
  .mobile-logo { display: inline-flex; }
}
</style>
