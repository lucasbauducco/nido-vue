const multer = require('multer')
const upload = multer({ dest: 'public/uploads/' })

module.exports = (app, { connection, protectedRoute, dbError }) => {

    app.get('/api/posts', (req, res) => {
        connection.query("SELECT * FROM post WHERE type = 'public' ORDER BY post_id DESC", (err, result) => {
            if (err) return dbError(res, err)

            return res.json(result)
        })
    })

    // rutas fijas antes que /:id para que no se confundan
    app.get('/api/posts/likes', protectedRoute, (req, res) => {
        connection.query('SELECT post_id FROM user_likes WHERE user_id = ?', [req.decoded.id], (err, result) => {
            if (err) return dbError(res, err)

            return res.json(result.map(row => row.post_id))
        })
    })

    app.get('/api/posts/:id', (req, res) => {
        connection.query('SELECT * FROM post WHERE post_id = ?', [req.params.id], (err, result) => {
            if (err) return dbError(res, err)
            if (!result[0]) return res.status(404).json({ error: 'Publicación no encontrada' })

            return res.json(result[0])
        })
    })

    app.post('/api/posts', protectedRoute, upload.single('source'), (req, res) => {
        const i = req.body
        const file = req.file
        if (!file)
            return res.status(400).json({ error: 'Falta la imagen' })

        connection.query(
            'INSERT INTO post (title, tags, description, source, user_id, type) VALUES (?,?,?,?,?,?)',
            [i.title, i.tags, i.description, `uploads/${file.filename}`, req.decoded.id, 'public'],
            (err) => {
                if (err) return dbError(res, err)

                return res.json({ ok: true })
            })
    })

    app.post('/api/posts/like/:postId', protectedRoute, (req, res) => {
        const post_id = req.params.postId
        const user_id = req.decoded.id

        connection.query('SELECT id FROM user_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id], (err, rows) => {
            if (err) return dbError(res, err)
            if (rows.length) return res.json({ ok: false }) // ya le habia dado like

            connection.query('INSERT INTO user_likes (user_id, post_id) VALUES (?,?)', [user_id, post_id], (err) => {
                if (err) return dbError(res, err)

                connection.query('UPDATE post SET likes = likes + 1 WHERE post_id = ?', [post_id], (err) => {
                    if (err) return dbError(res, err)

                    return res.json({ ok: true })
                })
            })
        })
    })

    app.get('/api/posts/:Id/comments', (req, res) => {
        connection.query(
            'SELECT comments.comment_id, comments.user_id, comments.post_id, comments.comment, users.username FROM comments LEFT JOIN users ON comments.user_id = users.user_id WHERE comments.post_id = ?',
            [req.params.Id],
            (err, result) => {
                if (err) return dbError(res, err)

                return res.json(result)
            })
    })

    app.post('/api/posts/:Id/comments', protectedRoute, (req, res) => {
        const comment = (req.body.comment || '').trim()
        if (!comment)
            return res.status(400).json({ error: 'El comentario está vacío' })

        connection.query('INSERT INTO comments (user_id, post_id, comment) VALUES (?,?,?)', [req.decoded.id, req.params.Id, comment], (err) => {
            if (err) return dbError(res, err)

            return res.json({ ok: true })
        })
    })
}
