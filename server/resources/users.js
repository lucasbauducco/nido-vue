const bcrypt = require('bcrypt')
const { viewerId, removeUpload, USERNAME_RE } = require('../lib/helpers')

const BIO_MAX = 160
const PASSWORD_MIN = 6

const USERNAME_RULE = 'El nombre de usuario debe tener entre 3 y 30 caracteres: letras, números, puntos o guiones bajos'

// traduce el error de clave duplicada de MySQL a un mensaje para la persona
const duplicateMessage = err =>
  /username/.test(err.sqlMessage || '') ? 'Ese nombre de usuario ya está en uso' : 'Ese email ya está registrado'

module.exports = (app, { connection, protectedRoute, optionalAuth, signToken, dbError, upload }) => {

  // ---------- sesion y cuenta propia ----------

  app.post('/api/users/register', (req, res) => {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username || !email || !password)
      return res.json({ error: 'Todos los campos son obligatorios' })
    if (!USERNAME_RE.test(username))
      return res.json({ error: USERNAME_RULE })
    if (password.length < PASSWORD_MIN)
      return res.json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres` })

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return dbError(res, err)

      connection.query('INSERT INTO users (username, email, password) VALUES (?,?,?)', [username, email, hash], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.json({ error: duplicateMessage(err) })
          return dbError(res, err)
        }

        const id = result.insertId
        return res.json({ token: signToken({ id }), id, username, avatar: null })
      })
    })
  })

  app.post('/api/users/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (!email || !password)
      return res.json({ error: 'Email y contraseña son obligatorios' })

    connection.query('SELECT user_id, username, avatar, password FROM users WHERE email = ?', [email], (err, result) => {
      if (err) return dbError(res, err)

      if (!result[0])
        return res.json({ error: 'Usuario no encontrado' })

      bcrypt.compare(password, result[0].password, (err, ok) => {
        if (err) return dbError(res, err)
        if (!ok)
          return res.json({ error: 'Contraseña incorrecta' })

        const id = result[0].user_id
        return res.json({ token: signToken({ id }), id, username: result[0].username, avatar: result[0].avatar })
      })
    })
  })

  // datos de la cuenta con la sesion iniciada
  app.get('/api/users/profile', protectedRoute, (req, res) => {
    connection.query('SELECT user_id, username, email, bio, avatar, is_private FROM users WHERE user_id = ?', [req.decoded.id], (err, result) => {
      if (err) return dbError(res, err)
      if (!result[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      return res.json(result[0])
    })
  })

  // editar nombre de usuario, biografia y privacidad
  app.put('/api/users/profile', protectedRoute, (req, res) => {
    const id = req.decoded.id
    const set = []
    const values = []

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim()
      if (!USERNAME_RE.test(username)) return res.json({ error: USERNAME_RULE })
      set.push('username = ?')
      values.push(username)
    }
    if (req.body.bio !== undefined) {
      set.push('bio = ?')
      values.push(String(req.body.bio).trim().slice(0, BIO_MAX))
    }
    if (req.body.is_private !== undefined) {
      set.push('is_private = ?')
      values.push(req.body.is_private ? 1 : 0)
    }
    if (!set.length) return res.json({ error: 'No hay cambios para guardar' })

    connection.query(`UPDATE users SET ${set.join(', ')} WHERE user_id = ?`, [...values, id], err => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.json({ error: duplicateMessage(err) })
        return dbError(res, err)
      }

      const finish = () => connection.query('SELECT user_id, username, email, bio, avatar, is_private FROM users WHERE user_id = ?', [id], (err, result) => {
        if (err) return dbError(res, err)
        return res.json({ ok: true, profile: result[0] })
      })

      // al pasar la cuenta a publica, las solicitudes pendientes se aceptan
      if (req.body.is_private === false || req.body.is_private === 0) {
        connection.query("UPDATE follows SET status = 'accepted' WHERE followed_id = ? AND status = 'pending'", [id], err => {
          if (err) return dbError(res, err)
          finish()
        })
      } else {
        finish()
      }
    })
  })

  // foto de perfil
  app.post('/api/users/avatar', protectedRoute, upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' })
    const id = req.decoded.id
    const avatar = `uploads/${req.file.filename}`

    connection.query('SELECT avatar FROM users WHERE user_id = ?', [id], (err, rows) => {
      if (err) return dbError(res, err)

      connection.query('UPDATE users SET avatar = ? WHERE user_id = ?', [avatar, id], err => {
        if (err) return dbError(res, err)
        if (rows[0]) removeUpload(rows[0].avatar)
        return res.json({ ok: true, avatar })
      })
    })
  })

  app.delete('/api/users/avatar', protectedRoute, (req, res) => {
    const id = req.decoded.id
    connection.query('SELECT avatar FROM users WHERE user_id = ?', [id], (err, rows) => {
      if (err) return dbError(res, err)

      connection.query('UPDATE users SET avatar = NULL WHERE user_id = ?', [id], err => {
        if (err) return dbError(res, err)
        if (rows[0]) removeUpload(rows[0].avatar)
        return res.json({ ok: true })
      })
    })
  })

  app.put('/api/users/password', protectedRoute, (req, res) => {
    const current = String(req.body.current || '')
    const next = String(req.body.next || '')
    if (next.length < PASSWORD_MIN)
      return res.json({ error: `La contraseña nueva debe tener al menos ${PASSWORD_MIN} caracteres` })

    connection.query('SELECT password FROM users WHERE user_id = ?', [req.decoded.id], (err, rows) => {
      if (err) return dbError(res, err)
      if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      bcrypt.compare(current, rows[0].password, (err, ok) => {
        if (err) return dbError(res, err)
        if (!ok) return res.json({ error: 'La contraseña actual no es correcta' })

        bcrypt.hash(next, 10, (err, hash) => {
          if (err) return dbError(res, err)
          connection.query('UPDATE users SET password = ? WHERE user_id = ?', [hash, req.decoded.id], err => {
            if (err) return dbError(res, err)
            return res.json({ ok: true })
          })
        })
      })
    })
  })

  // eliminar la cuenta y todo su contenido
  app.delete('/api/users/account', protectedRoute, (req, res) => {
    const id = req.decoded.id
    connection.query('SELECT password, avatar FROM users WHERE user_id = ?', [id], (err, rows) => {
      if (err) return dbError(res, err)
      if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      bcrypt.compare(String(req.body.password || ''), rows[0].password, (err, ok) => {
        if (err) return dbError(res, err)
        if (!ok) return res.json({ error: 'La contraseña no es correcta' })

        connection.query(
          'SELECT source FROM post WHERE user_id = ? AND source IS NOT NULL UNION SELECT source FROM stories WHERE user_id = ?',
          [id, id],
          (err, files) => {
            if (err) return dbError(res, err)

            connection.query('DELETE FROM users WHERE user_id = ?', [id], err => {
              if (err) return dbError(res, err)
              files.forEach(f => removeUpload(f.source))
              removeUpload(rows[0].avatar)
              return res.json({ ok: true })
            })
          })
      })
    })
  })

  // ---------- descubrir personas ----------

  app.get('/api/users/suggestions', protectedRoute, (req, res) => {
    const v = req.decoded.id
    connection.query(
      `SELECT u.user_id, u.username, u.avatar FROM users u
       WHERE u.user_id <> ? AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.followed_id = u.user_id)
       ORDER BY RAND() LIMIT 5`,
      [v, v],
      (err, result) => {
        if (err) return dbError(res, err)
        return res.json(result)
      })
  })

  app.get('/api/users/search', (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 30)
    if (!q) return res.json([])

    const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%'
    connection.query(
      'SELECT user_id, username, avatar, is_private FROM users WHERE username LIKE ? ORDER BY username LIMIT 12',
      [like],
      (err, result) => {
        if (err) return dbError(res, err)
        return res.json(result)
      })
  })

  // ---------- solicitudes de seguimiento (cuentas privadas) ----------

  app.get('/api/users/requests', protectedRoute, (req, res) => {
    connection.query(
      `SELECT u.user_id, u.username, u.avatar, f.created_at FROM follows f
       JOIN users u ON u.user_id = f.follower_id
       WHERE f.followed_id = ? AND f.status = 'pending' ORDER BY f.created_at DESC`,
      [req.decoded.id],
      (err, result) => {
        if (err) return dbError(res, err)
        return res.json(result)
      })
  })

  app.post('/api/users/requests/:id/accept', protectedRoute, (req, res) => {
    connection.query("UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND followed_id = ? AND status = 'pending'", [req.params.id, req.decoded.id], (err, result) => {
      if (err) return dbError(res, err)
      return res.json({ ok: result.affectedRows > 0 })
    })
  })

  app.delete('/api/users/requests/:id', protectedRoute, (req, res) => {
    connection.query("DELETE FROM follows WHERE follower_id = ? AND followed_id = ? AND status = 'pending'", [req.params.id, req.decoded.id], (err, result) => {
      if (err) return dbError(res, err)
      return res.json({ ok: result.affectedRows > 0 })
    })
  })

  // ---------- perfil de otra persona ----------

  app.get('/api/users/:id', optionalAuth, (req, res) => {
    const v = viewerId(req)
    connection.query(
      `SELECT u.user_id, u.username, u.bio, u.avatar, u.is_private,
        (SELECT COUNT(*) FROM post p WHERE p.user_id = u.user_id AND p.type = 'public') AS posts,
        (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.user_id AND f.status = 'accepted') AS followers,
        (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.user_id AND f.status = 'accepted') AS following
       FROM users u WHERE u.user_id = ?`,
      [req.params.id],
      (err, result) => {
        if (err) return dbError(res, err)
        const user = result[0]
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

        connection.query('SELECT status FROM follows WHERE follower_id = ? AND followed_id = ?', [v, user.user_id], (err, rows) => {
          if (err) return dbError(res, err)

          const isMe = v === user.user_id
          const status = rows[0] ? (rows[0].status === 'accepted' ? 'following' : 'pending') : 'none'
          return res.json({
            ...user,
            is_private: !!user.is_private,
            isMe,
            followStatus: isMe ? 'none' : status,
            // una cuenta privada solo muestra su contenido a sus seguidores
            canView: !user.is_private || isMe || status === 'following'
          })
        })
      })
  })

  // seguir (o pedir seguir si la cuenta es privada)
  app.post('/api/users/:id/follow', protectedRoute, (req, res) => {
    const me = req.decoded.id
    const target = Number(req.params.id)
    if (me === target) return res.status(400).json({ error: 'No podés seguirte a vos mismo' })

    connection.query('SELECT is_private FROM users WHERE user_id = ?', [target], (err, rows) => {
      if (err) return dbError(res, err)
      if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      const status = rows[0].is_private ? 'pending' : 'accepted'
      connection.query('INSERT IGNORE INTO follows (follower_id, followed_id, status) VALUES (?,?,?)', [me, target, status], err => {
        if (err) return dbError(res, err)

        connection.query('SELECT status FROM follows WHERE follower_id = ? AND followed_id = ?', [me, target], (err, f) => {
          if (err) return dbError(res, err)
          return res.json({ ok: true, status: f[0].status === 'accepted' ? 'following' : 'pending' })
        })
      })
    })
  })

  // dejar de seguir o cancelar la solicitud
  app.delete('/api/users/:id/follow', protectedRoute, (req, res) => {
    connection.query('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?', [req.decoded.id, req.params.id], err => {
      if (err) return dbError(res, err)
      return res.json({ ok: true, status: 'none' })
    })
  })
}
