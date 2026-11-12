# Nido

Red social para compartir fotos, hecha con Vue 3 y Node.js. El hornero y su nido son la identidad del proyecto: los "me gusta" son horneros.

> Proyecto en desarrollo. Hoy permite registrarse, iniciar sesión, publicar imágenes, dar me gusta y comentar.

## Stack

- **Cliente** (`client/`): Vue 3, Vuex, Vue Router, Stylus
- **Servidor** (`server/`): Node.js, Express, MySQL/MariaDB, JWT

## Cómo correrlo

Necesitás Node.js 16+ y MySQL o MariaDB.

### 1. Base de datos

```sql
CREATE DATABASE nido CHARACTER SET utf8mb4;
```

```bash
mysql -u <usuario> -p nido < nido.sql
```

El dump incluye un usuario de prueba: `demo@nido.app` / `demo1234`.

### 2. Servidor

```bash
cd server
cp .env.example .env     # completá JWT_SECRET, DB_USER y DB_PASSWORD
npm install
node index.js
```

### 3. Cliente

```bash
cd client
cp .env.example .env     # VUE_APP_API_URL apunta al servidor (por defecto http://localhost:4000)
npm install
npm run serve
```
