# Natours Project

Natours es una aplicacion web de tours construida con Node.js, Express y MongoDB.
El proyecto combina una API REST con vistas server-side en Pug para mostrar tours,
permitir login de usuarios, gestionar cuenta, consultar reseñas, reservar tours y
crear reservas locales de tours.

El codigo sigue el proyecto Natours del curso de Node/Express: modelos Mongoose,
controladores por recurso, rutas versionadas bajo `/api/v1` y templates Pug para
la experiencia web.

## Para que sirve

- Mostrar una pagina publica con todos los tours disponibles.
- Mostrar el detalle de un tour con ubicaciones en mapa, guias, imagenes y reseñas.
- Registrar usuarios, iniciar/cerrar sesion y mantener sesion con JWT en cookie.
- Editar datos de cuenta, foto de perfil y contraseña.
- Gestionar tours, usuarios, reseñas y reservas desde API protegida por roles.
- Calcular estadisticas, planes mensuales y busquedas geoespaciales de tours.
- Crear reservas demo sin pasarela de pago externa.
- Enviar correos de bienvenida y recuperacion de contraseña con SendGrid.

## Stack tecnologico

### Backend

- Node.js
- Express 4
- MongoDB
- Mongoose 8
- JWT para autenticacion
- bcryptjs para hash de passwords
- Multer y Sharp para subida y procesamiento de imagenes
- Nodemailer + SendGrid para email

### Frontend

- Pug como motor de templates server-side
- CSS estatico en `public/css/style.css`
- JavaScript modular en `public/js`
- Parcel 2 para generar `public/bundle/index.js`
- Axios para llamadas HTTP desde browser
- Mapbox GL JS para mapas

### Seguridad y middleware

- Helmet con CSP configurado para Mapbox y fuentes externas
- express-rate-limit para limitar `/api`
- express-mongo-sanitize contra NoSQL injection
- xss-clean contra XSS
- hpp contra parameter pollution
- cookie-parser para leer JWT desde cookies
- compression para respuestas comprimidas

## Estructura del proyecto

```txt
.
├── app.js                    # Configuracion de Express, middleware y rutas
├── server.js                 # Carga config.env, conecta MongoDB y levanta servidor
├── config.env                # Variables locales; no se versiona
├── controllers/              # Logica HTTP por recurso
├── models/                   # Schemas Mongoose
├── routes/                   # Rutas web y API
├── utils/                    # Helpers de errores, emails y query features
├── views/                    # Templates Pug
├── public/                   # Assets publicos, CSS, JS fuente y bundle
└── dev-data/                 # Datos seed, imagenes y script de importacion
```

## Rutas principales

### Vistas web

- `GET /` lista todos los tours.
- `GET /tour/:slug` muestra el detalle de un tour.
- `GET /login` muestra formulario de login.
- `GET /signup` muestra formulario de creacion de cuenta.
- `GET /me` muestra cuenta del usuario autenticado.
- `GET /my-tours` muestra reservas del usuario autenticado.

### API

- `/api/v1/tours`
- `/api/v1/users`
- `/api/v1/reviews`
- `/api/v1/bookings`

Ejemplos utiles:

```bash
GET /api/v1/tours/top-5-cheap
GET /api/v1/tours/tour-stats
GET /api/v1/tours/monthly-plan/2021
GET /api/v1/tours/tours-within/233/center/34.111745,-118.113491/unit/mi
GET /api/v1/tours/distance/34.111745,-118.113491/unit/mi
POST /api/v1/users/signup
POST /api/v1/users/login
GET /api/v1/users/logout
PATCH /api/v1/users/updateMe
PATCH /api/v1/users/updateMyPassword
POST /api/v1/bookings/book-tour/:tourId
```

La API de listados usa `APIFeatures`, por lo que soporta filtros, sort,
seleccion de campos y paginacion:

```bash
GET /api/v1/tours?difficulty=easy&price[lte]=1500&sort=price&fields=name,price&page=1&limit=10
```

## Variables de entorno

El proyecto espera un archivo `config.env` en la raiz. Ese archivo esta ignorado
por Git y no debe contenerse en commits.

Plantilla minima:

```env
NODE_ENV=development
PORT=3000

DATABASE=mongodb+srv://USER:<PASSWORD>@HOST/DATABASE?retryWrites=true&w=majority
DATABASE_PASSWORD=tu_password_de_mongodb

JWT_SECRET=un_secret_largo_y_privado
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

MAPBOX_ACCESS_TOKEN=pk_tu_token_publico_de_mapbox

EMAIL_FROM=tu-email@example.com
SENDGRID_USERNAME=apikey
SENDGRID_PASSWORD=tu_sendgrid_api_key
```

Notas:

- Mantener `PORT=3000` en desarrollo para coincidir con la guia local. El
  frontend usa rutas relativas hacia `/api/v1`, por lo que funciona desde
  `http://127.0.0.1:3000` o `http://localhost:3000`.
- `DATABASE` debe incluir el marcador `<PASSWORD>` porque `server.js` lo reemplaza
  con `DATABASE_PASSWORD`.
- Para email, el codigo usa SendGrid tanto en desarrollo como en produccion.
- `MAPBOX_ACCESS_TOKEN` es un token publico de Mapbox usado por la vista de
  detalle de tour para mostrar el mapa base `mapbox://styles/mapbox/streets-v12`.
  No se commitea en Git; el frontend lo lee desde `/api/v1/config`.
- Las reservas son demo/locales: el boton `Book tour now!` crea un registro en
  MongoDB y redirige a `/my-tours`. No requiere Stripe ni otra pasarela de pago.

## Como levantar el proyecto paso a paso

### 1. Entrar al proyecto

```bash
cd /home/spalmam/Documents/repositories/natours-project
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instala dependencias backend, Parcel, ESLint y Prettier. Si ya existe
`node_modules`, este paso solo sincroniza contra `package-lock.json`.

### 3. Crear o revisar `config.env`

Crear `config.env` en la raiz con las variables indicadas arriba. Para desarrollo,
usar:

```env
NODE_ENV=development
PORT=3000
```

Luego configurar la conexion MongoDB. Puede ser MongoDB Atlas o una instancia local,
pero el valor de `DATABASE` debe ser compatible con `mongoose.connect()`.

### 4. Preparar la base de datos

Con MongoDB configurado y accesible, cargar los datos de ejemplo:

```bash
node dev-data/data/import-dev-data.js --import
```

Para borrar los datos seed:

```bash
node dev-data/data/import-dev-data.js --delete
```

El script importa tours, usuarios y reseñas desde:

- `dev-data/data/tours.json`
- `dev-data/data/users.json`
- `dev-data/data/reviews.json`

Usuarios seed utiles para login:

- `demo-admin@example.com`
- `loulou@example.com`
- `sophie@example.com`

Password seed:

```txt
test1234
```

### 5. Compilar o observar el JavaScript del frontend

Las vistas cargan `public/bundle/index.js`, generado desde `public/js/index.js`.

Para desarrollo, dejar Parcel observando cambios en una terminal:

```bash
npm run watch:js
```

Para generar un bundle una sola vez:

```bash
npm run build:js
```

Si solo vas a ejecutar la app sin tocar `public/js`, el bundle ya existe en
`public/bundle/index.js`.

### 6. Levantar el servidor

En otra terminal:

```bash
npm run start:dev
```

Ese script ejecuta:

```bash
nodemon server.js
```

Si todo esta correcto, deberias ver logs similares a:

```txt
DB con succesful
app running on port 3000..
```

### 7. Abrir la app

Entrar en el browser:

```txt
http://127.0.0.1:3000
```

Flujo recomendado para probar:

1. Abrir `/`.
2. Entrar a un tour.
3. Ir a `/login`.
4. Loguearse con un usuario seed.
5. Ir a `/signup` y crear una cuenta nueva.
6. Entrar a `/me`.
7. Probar actualizar nombre/email.
8. Entrar a `/my-tours`.
9. Desde un tour, probar `Book tour now` para crear una reserva demo.

### 8. Probar endpoints API

Ejemplo de login:

```bash
curl -X POST http://127.0.0.1:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo-admin@example.com","password":"test1234"}'
```

Ejemplo de tours:

```bash
curl http://127.0.0.1:3000/api/v1/tours/top-5-cheap
```

Para rutas protegidas, usar el token recibido en login:

```bash
curl http://127.0.0.1:3000/api/v1/users/me \
  -H "Authorization: Bearer TU_TOKEN"
```

## Scripts disponibles

```bash
npm run start:dev   # Levanta server.js con nodemon
npm run start:prod  # Script de produccion definido en package.json
npm run debug       # Levanta server.js con ndb
npm run watch:js    # Parcel watch del JS frontend
npm run build:js    # Parcel build del JS frontend
```

Nota: `start:prod` usa sintaxis `set NODE_ENV=production`, propia de Windows.
En Linux/macOS, para produccion conviene usar:

```bash
NODE_ENV=production node server.js
```

## Desarrollo

- Editar templates en `views/`.
- Editar JavaScript fuente en `public/js/`.
- Recompilar con `npm run watch:js` o `npm run build:js`.
- Editar modelos en `models/`.
- Editar endpoints en `routes/` y `controllers/`.
- No editar manualmente `public/bundle/index.js`; es salida generada por Parcel.

## Testing y calidad

El proyecto tiene ESLint y Prettier configurados, pero no define script `test`,
`lint` ni `format` en `package.json`.

Comandos manuales utiles:

```bash
npx eslint .
npx prettier . --check
npx prettier . --write
```

## Problemas comunes

### La app no conecta a MongoDB

- Revisar `DATABASE`.
- Revisar que `DATABASE_PASSWORD` sea correcto.
- Confirmar whitelist/IP en MongoDB Atlas.
- Confirmar que el nombre de base de datos exista o pueda crearse.

### Login o acciones de cuenta fallan

- Confirmar que el server corre en `PORT=3000`.
- Confirmar que `public/bundle/index.js` esta actualizado.
- Revisar que los usuarios seed hayan sido importados.

### El mapa no aparece

- Revisar conexion a internet.
- Revisar que Mapbox GL JS cargue desde CDN.
- Revisar el token y style configurados en `public/js/mapbox.js`.

### Booking falla

- Confirmar que el usuario esta logueado antes de reservar.
- Confirmar que el tour existe y que MongoDB esta conectado.

### Emails no se envian

- Revisar `SENDGRID_USERNAME` y `SENDGRID_PASSWORD`.
- Confirmar que `EMAIL_FROM` sea valido/verificado segun la configuracion de SendGrid.
