const fs = require('fs')
const path = require('path')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

// Id de quien hace la consulta (0 si no inicio sesion)
const viewerId = req => (req.decoded && req.decoded.id) || 0

// Condicion SQL: el espectador puede ver el contenido del autor.
// Una cuenta privada solo se ve a si misma y a sus seguidores aceptados.
// Usa dos parametros: el id del espectador, dos veces.
const canSee = (alias = 'u') =>
  `(${alias}.is_private = 0 OR ${alias}.user_id = ? OR EXISTS (SELECT 1 FROM follows fv WHERE fv.follower_id = ? AND fv.followed_id = ${alias}.user_id AND fv.status = 'accepted'))`

// Borra un archivo subido. Solo toca la carpeta uploads.
const removeUpload = source => {
  if (!source || !/^uploads\/[A-Za-z0-9._-]+$/.test(source)) return
  fs.unlink(path.join(PUBLIC_DIR, source), () => {})
}

const USERNAME_RE = /^[A-Za-z0-9._]{3,30}$/

module.exports = { PUBLIC_DIR, viewerId, canSee, removeUpload, USERNAME_RE }
