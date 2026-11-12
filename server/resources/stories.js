const { viewerId, canSee, removeUpload } = require('../lib/helpers')

const CLEANUP_EVERY_MS = 10 * 60 * 1000

module.exports = (app, { connection, protectedRoute, optionalAuth, dbError, upload }) => {

    // Borra las historias de mas de 24 horas (fila y archivo)
    const cleanup = () => {
        connection.query('SELECT story_id, source FROM stories WHERE created_at <= (NOW() - INTERVAL 24 HOUR)', (err, rows) => {
            if (err) return console.error(err)
            if (!rows.length) return
            rows.forEach(r => removeUpload(r.source))
            connection.query('DELETE FROM stories WHERE story_id IN (?)', [rows.map(r => r.story_id)], err => {
                if (err) return console.error(err)
                console.log(`Historias vencidas eliminadas: ${rows.length}`)
            })
        })
    }
    cleanup()
    setInterval(cleanup, CLEANUP_EVERY_MS).unref()

    // Historias activas, agrupadas por persona. Las propias van primero.
    app.get('/api/stories', optionalAuth, (req, res) => {
        const v = viewerId(req)
        connection.query(
            `SELECT s.story_id, s.user_id, s.source, s.created_at, u.username, u.avatar
             FROM stories s JOIN users u ON u.user_id = s.user_id
             WHERE s.created_at > (NOW() - INTERVAL 24 HOUR) AND ${canSee('u')}
             ORDER BY s.created_at ASC`,
            [v, v],
            (err, rows) => {
                if (err) return dbError(res, err)

                const groups = new Map()
                rows.forEach(r => {
                    if (!groups.has(r.user_id)) {
                        groups.set(r.user_id, { user_id: r.user_id, username: r.username, avatar: r.avatar, isMine: r.user_id === v, stories: [] })
                    }
                    groups.get(r.user_id).stories.push({ story_id: r.story_id, source: r.source, created_at: r.created_at })
                })

                const list = [...groups.values()]
                const latest = g => g.stories[g.stories.length - 1].created_at
                list.sort((a, b) => (b.isMine - a.isMine) || (new Date(latest(b)) - new Date(latest(a))))
                return res.json(list)
            })
    })

    app.post('/api/stories', protectedRoute, upload.single('source'), (req, res) => {
        if (!req.file)
            return res.status(400).json({ error: 'Falta la imagen' })

        connection.query('INSERT INTO stories (user_id, source) VALUES (?,?)', [req.decoded.id, `uploads/${req.file.filename}`], (err, result) => {
            if (err) return dbError(res, err)

            return res.json({ ok: true, story_id: result.insertId })
        })
    })

    app.delete('/api/stories/:id', protectedRoute, (req, res) => {
        connection.query('SELECT source FROM stories WHERE story_id = ? AND user_id = ?', [req.params.id, req.decoded.id], (err, rows) => {
            if (err) return dbError(res, err)
            if (!rows[0]) return res.status(404).json({ error: 'Historia no encontrada' })

            connection.query('DELETE FROM stories WHERE story_id = ?', [req.params.id], err => {
                if (err) return dbError(res, err)
                removeUpload(rows[0].source)
                return res.json({ ok: true })
            })
        })
    })
}
