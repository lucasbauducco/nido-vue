<template>
  <main class="settings">
    <div class="wrap">
      <h1>Configuración</h1>

      <!-- perfil -->
      <section class="card" aria-labelledby="s-perfil">
        <h2 id="s-perfil">Tu perfil</h2>

        <div class="photo-row">
          <Avatar :name="form.username" :src="avatar" :size="84" />
          <div class="photo-actions">
            <strong>{{ form.username }}</strong>
            <div>
              <label class="btn btn-secondary btn-sm" for="avatar-file">Cambiar foto</label>
              <input id="avatar-file" ref="avatarFile" class="hidden" type="file" accept="image/*" @change="uploadAvatar">
              <button v-if="avatar" class="link-btn" type="button" @click="removeAvatar">Quitar</button>
            </div>
          </div>
        </div>

        <form @submit.prevent="saveProfile" novalidate>
          <div class="field">
            <label for="username">Nombre de usuario</label>
            <input id="username" v-model="form.username" class="input" type="text" maxlength="30" autocomplete="username">
            <small>Entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.</small>
          </div>
          <div class="field">
            <label for="bio">Biografía</label>
            <textarea id="bio" v-model="form.bio" class="input" maxlength="160" rows="3" placeholder="Contá algo sobre vos"></textarea>
            <small>{{ 160 - form.bio.length }} caracteres restantes</small>
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" :value="email" disabled>
          </div>
          <p v-if="msg.profile" class="note" :class="msg.profile.type" role="status">{{ msg.profile.text }}</p>
          <button class="btn btn-primary" type="submit" :disabled="busy.profile">Guardar cambios</button>
        </form>
      </section>

      <!-- privacidad -->
      <section class="card" aria-labelledby="s-priv">
        <h2 id="s-priv">Privacidad</h2>

        <div class="switch-row">
          <div>
            <strong id="priv-label">Cuenta privada</strong>
            <p>Solo las personas que aprobás pueden ver tus fotos, textos e historias. Quienes ya te siguen no se ven afectados.</p>
          </div>
          <button class="switch" type="button" role="switch" :aria-checked="isPrivate" aria-labelledby="priv-label" :class="{ on: isPrivate }" :disabled="busy.privacy" @click="togglePrivate"><span></span></button>
        </div>
        <p v-if="msg.privacy" class="note" :class="msg.privacy.type" role="status">{{ msg.privacy.text }}</p>

        <div class="requests">
          <h3>Solicitudes para seguirte</h3>
          <p v-if="!requests.length" class="muted">No tenés solicitudes pendientes.</p>
          <ul v-else>
            <li v-for="r in requests" :key="r.user_id">
              <router-link :to="`/u/${r.user_id}`" class="person"><Avatar :name="r.username" :src="r.avatar" :size="40" /><strong>{{ r.username }}</strong></router-link>
              <div class="req-actions">
                <button class="btn btn-primary btn-sm" type="button" @click="accept(r)">Aceptar</button>
                <button class="btn btn-secondary btn-sm" type="button" @click="reject(r)">Rechazar</button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- seguridad -->
      <section class="card" aria-labelledby="s-seg">
        <h2 id="s-seg">Contraseña</h2>
        <form @submit.prevent="changePassword" novalidate>
          <div class="field">
            <label for="pw-actual">Contraseña actual</label>
            <input id="pw-actual" v-model="pw.current" class="input" type="password" autocomplete="current-password">
          </div>
          <div class="field">
            <label for="pw-nueva">Contraseña nueva</label>
            <input id="pw-nueva" v-model="pw.next" class="input" type="password" autocomplete="new-password" placeholder="Al menos 6 caracteres">
          </div>
          <p v-if="msg.password" class="note" :class="msg.password.type" role="status">{{ msg.password.text }}</p>
          <button class="btn btn-secondary" type="submit" :disabled="busy.password || !pw.current || !pw.next">Cambiar contraseña</button>
        </form>
      </section>

      <!-- zona de peligro -->
      <section class="card danger" aria-labelledby="s-del">
        <h2 id="s-del">Eliminar cuenta</h2>
        <p class="muted">Se borran tu perfil, tus publicaciones, comentarios e historias. No se puede deshacer.</p>
        <template v-if="!confirmDelete">
          <button class="btn btn-danger" type="button" @click="confirmDelete = true">Eliminar mi cuenta</button>
        </template>
        <form v-else @submit.prevent="deleteAccount" novalidate>
          <div class="field">
            <label for="pw-del">Escribí tu contraseña para confirmar</label>
            <input id="pw-del" v-model="deletePassword" class="input" type="password" autocomplete="current-password">
          </div>
          <p v-if="msg.account" class="note" :class="msg.account.type" role="alert">{{ msg.account.text }}</p>
          <div class="row">
            <button class="btn btn-danger" type="submit" :disabled="!deletePassword || busy.account">Eliminar definitivamente</button>
            <button class="btn btn-secondary" type="button" @click="confirmDelete = false; deletePassword = ''">Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script>
import api from '@/api.js'
import Avatar from '@/components/Avatar.vue'

const errorText = e => (e.response && e.response.data && e.response.data.error) || 'No pudimos guardar. Intentá de nuevo.'

export default {
  components: { Avatar },
  data() {
    return {
      form: { username: '', bio: '' },
      email: '',
      avatar: null,
      isPrivate: false,
      requests: [],
      pw: { current: '', next: '' },
      confirmDelete: false,
      deletePassword: '',
      msg: {},
      busy: {}
    }
  },
  created() {
    api.get('/users/profile').then(r => {
      this.form.username = r.data.username
      this.form.bio = r.data.bio || ''
      this.email = r.data.email
      this.avatar = r.data.avatar
      this.isPrivate = !!r.data.is_private
    })
    this.loadRequests()
  },
  methods: {
    say(section, type, text) {
      this.msg = { ...this.msg, [section]: { type, text } }
    },
    loadRequests() {
      api.get('/users/requests').then(r => { this.requests = r.data }).catch(() => {})
    },
    saveProfile() {
      this.busy = { ...this.busy, profile: true }
      api.put('/users/profile', { username: this.form.username, bio: this.form.bio }).then(r => {
        if (r.data.error) return this.say('profile', 'bad', r.data.error)
        this.$store.commit('setUsername', r.data.profile.username)
        this.say('profile', 'good', 'Cambios guardados.')
      }).catch(e => this.say('profile', 'bad', errorText(e))).finally(() => {
        this.busy = { ...this.busy, profile: false }
      })
    },
    uploadAvatar(e) {
      const file = e.target.files[0]
      if (!file) return
      const data = new FormData()
      data.append('avatar', file)
      api.post('/users/avatar', data, { headers: { 'content-type': 'multipart/form-data' }, timeout: 60000 }).then(r => {
        this.avatar = r.data.avatar
        this.$store.commit('setAvatar', r.data.avatar)
        this.say('profile', 'good', 'Foto de perfil actualizada.')
      }).catch(err => this.say('profile', 'bad', errorText(err))).finally(() => {
        this.$refs.avatarFile.value = ''
      })
    },
    removeAvatar() {
      api.delete('/users/avatar').then(() => {
        this.avatar = null
        this.$store.commit('setAvatar', null)
        this.say('profile', 'good', 'Foto de perfil eliminada.')
      })
    },
    togglePrivate() {
      const next = !this.isPrivate
      this.busy = { ...this.busy, privacy: true }
      api.put('/users/profile', { is_private: next }).then(r => {
        if (r.data.error) return this.say('privacy', 'bad', r.data.error)
        this.isPrivate = next
        this.say('privacy', 'good', next ? 'Tu cuenta ahora es privada.' : 'Tu cuenta ahora es pública. Las solicitudes pendientes se aceptaron.')
        if (!next) this.requests = []
      }).catch(e => this.say('privacy', 'bad', errorText(e))).finally(() => {
        this.busy = { ...this.busy, privacy: false }
      })
    },
    accept(r) {
      api.post(`/users/requests/${r.user_id}/accept`).then(() => {
        this.requests = this.requests.filter(x => x.user_id !== r.user_id)
      })
    },
    reject(r) {
      api.delete(`/users/requests/${r.user_id}`).then(() => {
        this.requests = this.requests.filter(x => x.user_id !== r.user_id)
      })
    },
    changePassword() {
      this.busy = { ...this.busy, password: true }
      api.put('/users/password', this.pw).then(r => {
        if (r.data.error) return this.say('password', 'bad', r.data.error)
        this.pw = { current: '', next: '' }
        this.say('password', 'good', 'Contraseña actualizada.')
      }).catch(e => this.say('password', 'bad', errorText(e))).finally(() => {
        this.busy = { ...this.busy, password: false }
      })
    },
    deleteAccount() {
      this.busy = { ...this.busy, account: true }
      api.delete('/users/account', { data: { password: this.deletePassword } }).then(r => {
        if (r.data.error) return this.say('account', 'bad', r.data.error)
        this.$store.commit('logout')
        this.$router.push('/register')
      }).catch(e => this.say('account', 'bad', errorText(e))).finally(() => {
        this.busy = { ...this.busy, account: false }
      })
    }
  }
}
</script>

<style scoped>
.settings { padding: 28px 20px 56px; }
.wrap { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 22px; }
.card h2 { font-size: 20px; margin-bottom: 16px; }
.card h3 { font-size: 16px; margin-bottom: 10px; }
.muted { color: var(--muted); }
small { color: var(--muted); font-size: 15px; }
.hidden { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.btn { cursor: pointer; }

.photo-row { display: flex; align-items: center; gap: 18px; margin-bottom: 22px; }
.photo-actions { display: flex; flex-direction: column; gap: 8px; }
.photo-actions > div { display: flex; align-items: center; gap: 14px; }
.link-btn { border: none; background: transparent; color: var(--muted); text-decoration: underline; font-size: 16px; padding: 0; }
.link-btn:hover { color: var(--ink); }

.note { margin: 0 0 12px; font-size: 16px; }
.note.good { color: var(--pampa); }
.note.bad { color: #D64545; }

.switch-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.switch-row p { color: var(--muted); margin-top: 4px; max-width: 46ch; }
.switch { position: relative; flex: none; width: 52px; height: 30px; border: none; border-radius: 999px; background: var(--line); transition: background 140ms; margin-top: 2px; }
.switch span { position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 140ms; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); }
.switch.on { background: var(--accent); }
.switch.on span { transform: translateX(22px); }
.switch:disabled { opacity: 0.6; }
.switch-row + .note { margin-top: 12px; }

.requests { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--line); }
.requests ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.requests li { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.person { display: flex; align-items: center; gap: 10px; color: var(--ink); }
.person:hover { text-decoration: none; opacity: 0.8; }
.req-actions { display: flex; gap: 8px; }

.danger { border-color: color-mix(in srgb, #D64545 40%, var(--line)); }
.danger p { margin-bottom: 14px; }
.btn-danger { background: #D64545; color: #fff; }
.btn-danger:hover:not(:disabled) { opacity: 0.9; }
.row { display: flex; gap: 10px; flex-wrap: wrap; }

@media (max-width: 720px) {
  .settings { padding: 16px 12px 24px; }
  .card { padding: 18px; }
}
</style>
