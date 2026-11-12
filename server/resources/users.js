const bcrypt = require('bcrypt')

module.exports = (app, { connection, protectedRoute, signToken, dbError }) => {

  app.get('/api/users/profile', protectedRoute, (req, res) => {
    connection.query('SELECT user_id, username, email FROM users WHERE user_id = ?', [req.decoded.id], (err, result) => {
      if (err) return dbError(res, err)
      if (!result[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      return res.json(result[0])
    })
  })

  app.get('/api/users/:id', (req, res) => {
    connection.query('SELECT user_id, username FROM users WHERE user_id = ?', [req.params.id], (err, result) => {
      if (err) return dbError(res, err)
      if (!result[0]) return res.status(404).json({ error: 'Usuario no encontrado' })

      return res.json(result[0])
    })
  })

  app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
      return res.json({ error: 'Email y contraseña son obligatorios' })

    connection.query('SELECT user_id, username, password FROM users WHERE email = ?', [email], (err, result) => {
      if (err) return dbError(res, err)

      if (!result[0])
        return res.json({ error: 'Usuario no encontrado' })

      bcrypt.compare(password, result[0].password, (err, ok) => {
        if (err) return dbError(res, err)
        if (!ok)
          return res.json({ error: 'Contraseña incorrecta' })

        const id = result[0].user_id
        return res.json({ token: signToken({ id }), id, username: result[0].username })
      })
    })
  })

  app.post('/api/users/register', (req, res) => {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.json({ error: 'Todos los campos son obligatorios' })

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return dbError(res, err)

      connection.query('INSERT INTO users (username, email, password) VALUES (?,?,?)', [username, email, hash], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.json({ error: 'Ese email ya está registrado' })
          return dbError(res, err)
        }

        const id = result.insertId
        return res.json({ token: signToken({ id }), id, username })
      })
    })
  })
}
