// Fecha relativa en espanol: "ahora", "hace 5 min", "hace 3 h", "hace 2 d"
export function timeAgo(value) {
  const t = new Date(value).getTime()
  if (!t) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 45) return 'ahora'
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d} d`
  return new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Tiempo que le queda a una historia (duran 24 horas)
export function storyTimeLeft(createdAt) {
  const left = new Date(createdAt).getTime() + 24 * 3600 * 1000 - Date.now()
  if (left <= 0) return 'por vencer'
  const h = Math.floor(left / 3600000)
  if (h >= 1) return `se borra en ${h} h`
  return `se borra en ${Math.max(1, Math.floor(left / 60000))} min`
}
