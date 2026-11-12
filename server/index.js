require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const mysql = require('mysql')
const multer = require('multer')
const { PUBLIC_DIR } = require('./lib/helpers')

const {
    JWT_SECRET,
    DB_HOST = 'localhost',
    DB_PORT = 3306,
    DB_USER,
    DB_PASSWORD = '',
    DB_NAME = 'nido',
    PORT = 4000,
    CORS_ORIGIN
} = process.env

if (!JWT_SECRET || !DB_USER) {
    console.error('Faltan variables de entorno (JWT_SECRET y DB_USER son obligatorias). Copia .env.example a .env y completalo.')
    process.exit(1)
}

const app = express()
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN.split(',') } : undefined))
app.use(express.json({ limit: '1mb' }))
app.use(express.static(PUBLIC_DIR)) // carpeta publica (imagenes subidas)

// pool en lugar de una conexion unica: se reconecta solo si MySQL corta la conexion
const connection = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    timezone: 'Z'
})
// todas las fechas se guardan y se leen en UTC
connection.on('connection', conn => conn.query("SET time_zone = '+00:00'"))

// subida de imagenes: solo imagenes, hasta 10 MB
const upload = multer({
    dest: path.join(PUBLIC_DIR, 'uploads'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Solo se permiten imágenes'))
})

const signToken = payload => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

const protectedRoute = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' })

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
            return res.status(401).json({ error: 'Unauthorized' })
        req.decoded = decoded // { id }
        next()
    })
}

// igual que protectedRoute, pero deja pasar a quien no inicio sesion
const optionalAuth = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return next()
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) req.decoded = decoded
        next()
    })
}

// ante un error de base de datos respondemos 500 en vez de tumbar el servidor
const dbError = (res, err) => {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
}

const ctx = { connection, protectedRoute, optionalAuth, signToken, dbError, upload }

require('./resources/users')(app, ctx)
require('./resources/post')(app, ctx)
require('./resources/stories')(app, ctx)

// errores de subida (archivo muy grande, tipo no permitido)
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    const tooBig = err.code === 'LIMIT_FILE_SIZE'
    res.status(400).json({ error: tooBig ? 'La imagen supera los 10 MB' : err.message })
})

app.listen(PORT, () => {
    console.log(`Nido server corriendo en el puerto ${PORT}`)
})
