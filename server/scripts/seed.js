/*
 * Carga datos de demostracion en Nido usando la API publica del servidor:
 * crea usuarios con biografia, publica fotos y textos, arma seguidores, sube historias,
 * da me gusta y comenta.
 *
 * Uso (con el servidor corriendo):
 *   npm run seed
 *   API_URL=http://localhost:4000 POSTS=18 TEXTS=12 STORIES=8 npm run seed
 *
 * Las imagenes son paisajes ilustrados con la paleta de Nido, generados en el momento.
 */
const sharp = require('sharp')

const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '') + '/api'
const POSTS = Number(process.env.POSTS || 14)
const TEXTS = Number(process.env.TEXTS || 10)
const STORIES = Number(process.env.STORIES || 8)
const PASSWORD = process.env.SEED_PASSWORD || 'nido1234'

const USERS = [
  { username: 'valeria.sierra', email: 'valeria@nido.app', bio: 'Fotos de campo y caminos de tierra. Tandil, Buenos Aires.' },
  { username: 'tomas.pampa', email: 'tomas@nido.app', bio: 'Mate, cielo abierto y silencio.' },
  { username: 'lucia.arroyo', email: 'lucia@nido.app', bio: 'Persiguiendo la hora dorada.' },
  { username: 'mateo.cielo', email: 'mateo@nido.app', bio: 'Noches de estrellas y cuentos del campo.' }
]

const TEXT_POSTS = [
  'Hoy vi un hornero terminando su nido. Tres semanas de barro y paciencia. Hay mucho que aprender de ese pajarito. #hornero #pampa',
  'Nada se compara con el olor a tierra mojada después de la lluvia. #campo',
  'Consejo del día: salí media hora antes del amanecer. La luz lo cambia todo. #fotografia #amanecer',
  'Alguien sabe de un buen camino de tierra para recorrer en bici por la zona de las sierras? #sierras',
  'Cada foto es un nido: se arma de a poco y se comparte con quien querés. #nido',
  'El mate sabe mejor cuando no hay apuro. #mate #pampa',
  'Terminé de editar la serie del atardecer. Les va a gustar. #atardecer',
  'Dato curioso: el hornero es el ave nacional argentina y siempre construye su nido mirando para el mismo lado. #hornero #argentina',
  'Se viene fin de semana largo. Mochila lista, cámara cargada. #viaje',
  'Hay silencios que valen más que mil fotos. #cielo'
]

const SCENES = [
  { kind: 'amanecer', sky: ['#7A8FB8', '#F6C58E', '#F08A55'], sun: '#FFE3B8', sunY: 0.62, hills: ['#6E8B5E', '#4F7448', '#3A5C3A'], stars: false,
    titles: ['Amanecer en la pampa', 'Primera luz del día', 'Mate al amanecer'] },
  { kind: 'dia', sky: ['#4F93C2', '#9CC9E0', '#DDEBF0'], sun: '#FFF6D6', sunY: 0.2, hills: ['#7FA46A', '#5C8F55', '#3F7D5A'], stars: false,
    titles: ['Tarde de campo', 'Cielo abierto en el camino', 'Domingo de campo'] },
  { kind: 'atardecer', sky: ['#3B3A6B', '#C4501B', '#F6A55B'], sun: '#FFD59A', sunY: 0.58, hills: ['#7A4A3A', '#53362E', '#2F2420'], stars: false,
    titles: ['Atardecer en las sierras', 'La hora dorada', 'Se esconde el sol'] },
  { kind: 'noche', sky: ['#0E1626', '#1B2A48', '#35507A'], sun: '#F2EEDC', sunY: 0.22, hills: ['#1F3A33', '#162B27', '#0E1B1A'], stars: true,
    titles: ['Noche serena en el campo', 'Cielo estrellado', 'Luna sobre la llanura'] }
]

const DESCRIPTIONS = [
  'Después de tres semanas de barro, por fin quedó terminado.',
  'Un rato de silencio y el campo para nosotros solos.',
  'Camino de tierra, mate y nada más que hacer.',
  'La luz de esta hora no se repite.',
  'Salimos temprano y valió cada kilómetro.',
  'Así se ve el horizonte desde la tranquera.'
]
const TAGS = ['pampa', 'campo', 'hornero', 'paisaje', 'cielo', 'sierras', 'mate', 'argentina', 'atardecer', 'naturaleza']
const COMMENTS = [
  'Qué lindo lugar.', 'Esa luz es increíble.', 'Quiero ir ya mismo.', 'Me encantó, gracias por compartir.',
  'Qué paz que transmite.', 'Se nota que el hornero eligió bien.', 'Pasame la ubicación.', 'La mejor foto de la semana.'
]

const rand = (a, b) => a + Math.random() * (b - a)
const pick = list => list[Math.floor(Math.random() * list.length)]
const pickMany = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n)

function hillPath(w, h, base, amp, color) {
  const f1 = rand(1.2, 2.6)
  const f2 = rand(3, 5)
  const p1 = rand(0, 6.28)
  const p2 = rand(0, 6.28)
  let d = `M0 ${h} L0 ${base}`
  for (let x = 0; x <= w; x += w / 40) {
    const t = x / w
    const y = base + amp * (Math.sin(t * f1 * 6.28 + p1) * 0.7 + Math.sin(t * f2 * 6.28 + p2) * 0.3)
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return `<path d="${d} L${w} ${h} Z" fill="${color}"/>`
}

function nest(x, y, size) {
  // el nido de hornero sobre un poste
  const w = size
  const h = size * 0.82
  return `
    <rect x="${x - size * 0.06}" y="${y}" width="${size * 0.12}" height="${size * 1.4}" fill="#2B1D16"/>
    <path fill-rule="evenodd" fill="#4D2D20" d="M${x - w / 2} ${y} C${x - w / 2} ${y - h * 0.9} ${x - w / 4} ${y - h} ${x} ${y - h} S${x + w / 2} ${y - h * 0.9} ${x + w / 2} ${y} Z M${x - w * 0.14} ${y} C${x - w * 0.14} ${y - h * 0.32} ${x - w * 0.07} ${y - h * 0.42} ${x} ${y - h * 0.42} S${x + w * 0.14} ${y - h * 0.32} ${x + w * 0.14} ${y} Z"/>`
}

function sceneSvg(scene, w, h) {
  const horizon = h * rand(0.55, 0.68)
  const sunX = w * rand(0.2, 0.8)
  const sunY = h * scene.sunY
  const sunR = Math.min(w, h) * rand(0.07, 0.12)

  let stars = ''
  if (scene.stars) {
    for (let i = 0; i < 70; i++) {
      stars += `<circle cx="${rand(0, w).toFixed(1)}" cy="${rand(0, horizon * 0.8).toFixed(1)}" r="${rand(0.6, 2).toFixed(1)}" fill="#fff" opacity="${rand(0.4, 1).toFixed(2)}"/>`
    }
  }

  let clouds = ''
  if (scene.kind !== 'noche') {
    for (let i = 0; i < 3; i++) {
      const cx = rand(0, w)
      const cy = rand(h * 0.1, horizon * 0.65)
      const cw = rand(w * 0.12, w * 0.26)
      clouds += `<g opacity="${rand(0.25, 0.5).toFixed(2)}" fill="#fff"><ellipse cx="${cx}" cy="${cy}" rx="${cw}" ry="${cw * 0.18}"/><ellipse cx="${cx + cw * 0.4}" cy="${cy - cw * 0.1}" rx="${cw * 0.6}" ry="${cw * 0.16}"/></g>`
    }
  }

  const hills = [
    hillPath(w, h, horizon, h * 0.04, scene.hills[0]),
    hillPath(w, h, horizon + h * 0.1, h * 0.05, scene.hills[1]),
    hillPath(w, h, horizon + h * 0.2, h * 0.05, scene.hills[2])
  ].join('')

  const nestSize = Math.min(w, h) * rand(0.1, 0.16)
  const nestX = w * rand(0.18, 0.82)
  const nestY = horizon + h * 0.2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${scene.sky[0]}"/><stop offset="0.6" stop-color="${scene.sky[1]}"/><stop offset="1" stop-color="${scene.sky[2]}"/>
      </linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="${scene.sun}" stop-opacity="0.9"/><stop offset="1" stop-color="${scene.sun}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    ${stars}
    <circle cx="${sunX}" cy="${sunY}" r="${sunR * 4}" fill="url(#glow)"/>
    <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${scene.sun}"/>
    ${clouds}
    ${hills}
    ${nest(nestX, nestY, nestSize)}
  </svg>`
}

async function makeImage(size) {
  const [w, h] = size || pick([[1200, 900], [900, 1200], [1100, 1100], [1280, 800], [1000, 1300]])
  const scene = pick(SCENES)
  const jpeg = await sharp(Buffer.from(sceneSvg(scene, w, h))).jpeg({ quality: 88 }).toBuffer()
  return { jpeg, scene }
}

async function call(path, options = {}) {
  const res = await fetch(API + path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} respondio ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function session(user) {
  let data = await call('/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...user, password: PASSWORD })
  })
  if (data.error) {
    data = await call('/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: PASSWORD })
    })
  }
  if (!data.token) throw new Error(`No se pudo iniciar sesion con ${user.email}: ${data.error}`)
  await call('/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: data.token },
    body: JSON.stringify({ bio: user.bio })
  })
  return { ...user, token: data.token, id: data.id }
}

async function main() {
  console.log(`Cargando datos de demo en ${API}`)
  const sessions = []
  for (const u of USERS) sessions.push(await session(u))
  console.log(`Usuarios listos: ${sessions.map(s => s.username).join(', ')} (contraseña: ${PASSWORD})`)

  const postIds = []
  for (let i = 0; i < POSTS; i++) {
    const author = pick(sessions)
    const { jpeg, scene } = await makeImage()

    const form = new FormData()
    form.set('title', pick(scene.titles))
    form.set('description', pick(DESCRIPTIONS))
    form.set('tags', pickMany(TAGS, 3).join(', '))
    form.set('source', new Blob([jpeg], { type: 'image/jpeg' }), 'demo.jpg')

    await call('/posts', { method: 'POST', headers: { Authorization: author.token }, body: form })
    process.stdout.write(`\rPublicaciones: ${i + 1}/${POSTS}`)
  }
  console.log()

  // publicaciones de solo texto
  for (let i = 0; i < TEXTS; i++) {
    const author = pick(sessions)
    await call('/posts/text', {
      method: 'POST',
      headers: { Authorization: author.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: TEXT_POSTS[i % TEXT_POSTS.length] })
    })
  }
  console.log(`Textos: ${TEXTS}`)

  // seguidores: cada persona sigue a otras dos
  for (const s of sessions) {
    for (const other of pickMany(sessions.filter(o => o.id !== s.id), 2)) {
      await call(`/users/${other.id}/follow`, { method: 'POST', headers: { Authorization: s.token } })
    }
  }

  // historias (duran 24 horas)
  for (let i = 0; i < STORIES; i++) {
    const author = sessions[i % sessions.length]
    const { jpeg } = await makeImage([900, 1600])
    const form = new FormData()
    form.set('source', new Blob([jpeg], { type: 'image/jpeg' }), 'historia.jpg')
    await call('/stories', { method: 'POST', headers: { Authorization: author.token }, body: form })
  }
  console.log(`Historias: ${STORIES}`)

  const posts = await call('/posts?limit=100')
  posts.forEach(p => postIds.push(p.post_id))

  let likes = 0
  let comments = 0
  for (const s of sessions) {
    // el me gusta alterna, asi que solo se da en publicaciones que todavia no gustaron
    const already = await call('/posts/likes', { headers: { Authorization: s.token } })
    const candidates = postIds.filter(id => !already.includes(id))
    for (const id of pickMany(candidates, Math.ceil(candidates.length * rand(0.3, 0.6)))) {
      const r = await call(`/posts/like/${id}`, { method: 'POST', headers: { Authorization: s.token } })
      if (r.liked) likes++
    }
    for (const id of pickMany(postIds, Math.ceil(postIds.length * 0.3))) {
      await call(`/posts/${id}/comments`, {
        method: 'POST',
        headers: { Authorization: s.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: pick(COMMENTS) })
      })
      comments++
    }
  }
  console.log(`Listo: ${likes} me gusta y ${comments} comentarios nuevos.`)
}

main().catch(err => {
  console.error('\nError:', err.message)
  process.exit(1)
})
