const { viewerId, canSee, removeUpload } = require('../lib/helpers')

const TEXT_MAX = 280

// Campos que devuelve cada publicacion, con su autor y la cantidad de comentarios
const POST_FIELDS = `p.post_id, p.title, p.tags, p.description, p.source, p.likes, p.kind, p.user_id, p.created_at,
    u.username, u.avatar,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count`

module.exports = (app, { connection, protectedRoute, optionalAuth, dbError, upload }) => {

    // Una publicacion visible para quien consulta (las de cuentas privadas solo las ven sus seguidores)
    const findVisiblePost = (postId, viewer, cb) => {
        connection.query(
            `SELECT ${POST_FIELDS} FROM post p JOIN users u ON u.user_id = p.user_id
             WHERE p.post_id = ? AND p.type = 'public' AND ${canSee('u')}`,
            [postId, viewer, viewer],
            cb)
    }

    // Lista de publicaciones. Filtros: kind=image|text, user=<id>, feed=following, limit, offset
    app.get('/api/posts', optionalAuth, (req, res) => {
        const v = viewerId(req)
        const where = ["p.type = 'public'", canSee('u')]
        const params = [v, v]

        if (req.query.kind === 'image' || req.query.kind === 'text') {
            where.push('p.kind = ?')
            params.push(req.query.kind)
        }
        if (req.query.user) {
            where.push('p.user_id = ?')
            params.push(Number(req.query.user))
        }
        if (req.query.feed === 'following') {
            if (!v) return res.json([])
            where.push("(p.user_id = ? OR p.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ? AND status = 'accepted'))")
            params.push(v, v)
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 40, 1), 100)
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)

        connection.query(
            `SELECT ${POST_FIELDS} FROM post p JOIN users u ON u.user_id = p.user_id
             WHERE ${where.join(' AND ')}
             ORDER BY p.created_at DESC, p.post_id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, result) => {
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

    app.get('/api/posts/:id', optionalAuth, (req, res) => {
        findVisiblePost(req.params.id, viewerId(req), (err, result) => {
            if (err) return dbError(res, err)
            if (!result[0]) return res.status(404).json({ error: 'Publicación no encontrada' })

            return res.json(result[0])
        })
    })

    // Publicacion con imagen (estilo Instagram)
    app.post('/api/posts', protectedRoute, upload.single('source'), (req, res) => {
        const i = req.body
        const file = req.file
        if (!file)
            return res.status(400).json({ error: 'Falta la imagen' })

        connection.query(
            "INSERT INTO post (title, tags, description, source, user_id, type, kind) VALUES (?,?,?,?,?,'public','image')",
            [i.title || '', i.tags || '', i.description || '', `uploads/${file.filename}`, req.decoded.id],
            (err, result) => {
                if (err) return dbError(res, err)

                return res.json({ ok: true, post_id: result.insertId })
            })
    })

    // Publicacion de solo texto (estilo Twitter). Los #hashtags pasan a ser etiquetas.
    app.post('/api/posts/text', protectedRoute, (req, res) => {
        const text = String(req.body.text || '').trim()
        if (!text)
            return res.status(400).json({ error: 'Escribí algo para publicar' })
        if (text.length > TEXT_MAX)
            return res.status(400).json({ error: `El texto no puede superar los ${TEXT_MAX} caracteres` })

        const tags = [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).map(t => t.slice(1).toLowerCase()))].join(', ')

        connection.query(
            "INSERT INTO post (title, tags, description, source, user_id, type, kind) VALUES ('',?,?,NULL,?,'public','text')",
            [tags, text, req.decoded.id],
            (err, result) => {
                if (err) return dbError(res, err)

                return res.json({ ok: true, post_id: result.insertId })
            })
    })

    // Borrar una publicacion propia
    app.delete('/api/posts/:id', protectedRoute, (req, res) => {
        connection.query('SELECT source FROM post WHERE post_id = ? AND user_id = ?', [req.params.id, req.decoded.id], (err, rows) => {
            if (err) return dbError(res, err)
            if (!rows[0]) return res.status(404).json({ error: 'Publicación no encontrada' })

            connection.query('DELETE FROM post WHERE post_id = ?', [req.params.id], err => {
                if (err) return dbError(res, err)
                removeUpload(rows[0].source)
                return res.json({ ok: true })
            })
        })
    })

    // Me gusta: si ya lo diste, lo saca (sirve para el doble clic)
    app.post('/api/posts/like/:postId', protectedRoute, (req, res) => {
        const post_id = req.params.postId
        const user_id = req.decoded.id

        findVisiblePost(post_id, user_id, (err, found) => {
            if (err) return dbError(res, err)
            if (!found[0]) return res.status(404).json({ error: 'Publicación no encontrada' })

            connection.query('SELECT id FROM user_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id], (err, rows) => {
                if (err) return dbError(res, err)

                const liked = !rows.length
                const change = liked
                    ? ['INSERT IGNORE INTO user_likes (user_id, post_id) VALUES (?,?)', [user_id, post_id]]
                    : ['DELETE FROM user_likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]]

                connection.query(change[0], change[1], err => {
                    if (err) return dbError(res, err)

                    // se recalcula el total para que nunca quede desfasado
                    connection.query('UPDATE post SET likes = (SELECT COUNT(*) FROM user_likes WHERE post_id = ?) WHERE post_id = ?', [post_id, post_id], err => {
                        if (err) return dbError(res, err)

                        connection.query('SELECT likes FROM post WHERE post_id = ?', [post_id], (err, result) => {
                            if (err) return dbError(res, err)

                            return res.json({ ok: true, liked, likes: result[0].likes })
                        })
                    })
                })
            })
        })
    })

    app.get('/api/posts/:Id/comments', optionalAuth, (req, res) => {
        const v = viewerId(req)
        connection.query(
            `SELECT c.comment_id, c.user_id, c.post_id, c.comment, c.created_at, u.username, u.avatar
             FROM comments c
             JOIN users u ON u.user_id = c.user_id
             JOIN post p ON p.post_id = c.post_id
             JOIN users a ON a.user_id = p.user_id
             WHERE c.post_id = ? AND ${canSee('a')}
             ORDER BY c.comment_id ASC`,
            [req.params.Id, v, v],
            (err, result) => {
                if (err) return dbError(res, err)

                return res.json(result)
            })
    })

    app.post('/api/posts/:Id/comments', protectedRoute, (req, res) => {
        const comment = (req.body.comment || '').trim().slice(0, 255)
        if (!comment)
            return res.status(400).json({ error: 'El comentario está vacío' })

        findVisiblePost(req.params.Id, req.decoded.id, (err, found) => {
            if (err) return dbError(res, err)
            if (!found[0]) return res.status(404).json({ error: 'Publicación no encontrada' })

            connection.query('INSERT INTO comments (user_id, post_id, comment) VALUES (?,?,?)', [req.decoded.id, req.params.Id, comment], (err) => {
                if (err) return dbError(res, err)

                return res.json({ ok: true })
            })
        })
    })
}
