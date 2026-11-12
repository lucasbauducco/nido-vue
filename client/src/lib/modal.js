// La publicacion abierta se guarda en la URL (?post=ID), asi funciona sobre cualquier pantalla.
const without = query => {
  const rest = { ...query }
  delete rest.post
  return rest
}

export function openPost(router, route, id) {
  router.push({ path: route.path, query: { ...route.query, post: String(id) } })
}

export function closePost(router, route) {
  const target = router.resolve({ path: route.path, query: without(route.query) })
  const back = window.history.state && window.history.state.back
  // si venimos de la misma pantalla sin la publicacion, volver atras evita historial repetido
  if (back && back === target.fullPath) router.back()
  else router.replace(target)
}
