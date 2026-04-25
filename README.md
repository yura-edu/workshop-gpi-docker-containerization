# Containerización con Docker

> **Tipo:** DEVOPS_CONFIG · **Duración estimada:** 180 min · **Nivel:** Intermedio

## Objetivo

Containerizar una API REST con un Dockerfile multi-stage optimizado y orquestar múltiples servicios con Docker Compose.

## Contexto

Recibirás una API Node.js que se conecta a PostgreSQL y Redis. Tu tarea es escribir los archivos de configuración necesarios para que la app corra en cualquier entorno con un solo comando: `docker compose up`.

## Instrucciones

### 1. Prepara tu entorno

```bash
git clone <url-de-tu-repositorio>
cd workshop-gpi-docker-containerization
```

Verifica que Docker esté instalado:

```bash
docker --version          # Docker 24+
docker compose version    # Compose 2+
```

### 2. Estudia la aplicación

Lee `src/app.js` y entiende:
- El puerto que usa (`PORT`, default 3000)
- Cómo lee la URL de la base de datos (`DATABASE_URL`)
- Cómo lee la URL de Redis (`REDIS_URL`)

### 3. Crea el `.dockerignore`

```
node_modules
.env
.git
*.md
```

Cualquier archivo listado aquí no se copiará al contexto de build, reduciendo el tamaño de la imagen.

### 4. Escribe el `Dockerfile` multi-stage

Un Dockerfile multi-stage tiene al menos dos `FROM`:

```dockerfile
# Etapa 1: builder — instala dependencias
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: runtime — imagen final ligera
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json .
EXPOSE 3000
CMD ["node", "src/app.js"]
```

Adapta este esqueleto: usa `node:22-alpine` en runtime para mantener la imagen ≤ 250 MB.

### 5. Escribe el `docker-compose.yml`

Define 3 servicios: `app`, `db` (PostgreSQL 16), y `redis` (Redis 7). El servicio `app` debe:
- Configurar `DATABASE_URL` y `REDIS_URL` apuntando a los otros servicios
- Usar `depends_on` con `condition: service_healthy`

Los servicios `db` y `redis` deben tener `healthcheck` configurado. La base de datos debe usar un volumen nombrado.

### 6. Actualiza el CI

Edita `.github/workflows/ci.yml` para que el job construya la imagen Docker y verifique su tamaño:

```bash
docker build -t workshop-app .
SIZE_BYTES=$(docker image inspect workshop-app --format='{{.Size}}')
SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
echo "Image size: ${SIZE_MB} MB"
[ "$SIZE_MB" -le 250 ] || exit 1
```

### 7. Prueba localmente

```bash
# Construye y levanta todo
docker compose up --build

# En otra terminal, verifica que responda
curl http://localhost:3000/health

# Apaga
docker compose down
```

### 8. Abre el Pull Request

Sube tu rama y abre un PR hacia `main`. Verifica que el pipeline pase en la pestaña **Actions**.

## Criterios de evaluación

| Métrica | Peso | Umbral |
|---|---|---|
| Archivos de configuración existen | 15% | `Dockerfile`, `docker-compose.yml`, `.dockerignore` presentes |
| Schema válido | 20% | `docker-compose.yml` válido con servicios `app`, `db`, `redis` |
| Imagen se construye | 30% | `docker build` completa sin errores |
| Tamaño de imagen | 20% | Imagen resultante ≤ 250 MB |
| Pipeline CI | 15% | El workflow construye la imagen y valida el tamaño |

## Recursos

- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose file reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [docker/setup-buildx-action](https://github.com/docker/setup-buildx-action)
