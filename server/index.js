require('dotenv').config()

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const mysql = require('mysql')

const {
    JWT_SECRET,
    DB_HOST = 'localhost',
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
app.use(express.json({ limit: '50mb' }))
app.use(express.static('public')) // carpeta publica (imagenes subidas)

// pool en lugar de una conexion unica: se reconecta solo si MySQL corta la conexion
const connection = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
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

// ante un error de base de datos respondemos 500 en vez de tumbar el servidor
const dbError = (res, err) => {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
}

const ctx = { connection, protectedRoute, signToken, dbError }

require('./resources/users')(app, ctx)
require('./resources/post')(app, ctx)

app.listen(PORT, () => {
    console.log(`Nido server corriendo en el puerto ${PORT}`)
})
