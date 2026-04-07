# 🚗 FleetFlow – Frontend

![Node.js CI](https://github.com/FleetFlow-Zarodolgozat/FleetFlow_frontend/actions/workflows/node.js.yml/badge.svg)
![Deploy](https://github.com/FleetFlow-Zarodolgozat/FleetFlow_frontend/actions/workflows/deploy.yml/badge.svg)

A **FleetFlow** egy modern járműflotta-kezelő webalkalmazás frontendja, amely **React** + **Vite** technológiákra épül. Az alkalmazás lehetővé teszi az adminisztrátorok és sofőrök számára a járművek, utak, üzemanyag-naplók és szervizkérelmek kezelését.

---

## 📋 Tartalomjegyzék

- [Technológiák](#-technológiák)
- [Funkciók](#-funkciók)
- [Helyi fejlesztői környezet](#-helyi-fejlesztői-környezet)
- [Docker](#-docker)
- [Kubernetes](#-kubernetes)
- [CI/CD](#-cicd)

---

## 🛠 Technológiák

| Technológia | Verzió |
|---|---|
| React | 19 |
| Vite | 7 |
| React Router DOM | 7 |
| Bootstrap / React-Bootstrap | 5 |
| Axios | 1 |
| Leaflet / React-Leaflet | 1.9 / 5 |
| React Big Calendar | 1 |
| Cypress (E2E tesztek) | 15 |
| Nginx | alpine |
| Node.js | 20 (LTS) |

---

## ✨ Funkciók

### Admin szerepkör
- 📊 Admin irányítópult
- 🚗 Járművek kezelése (hozzáadás, szerkesztés, törlés)
- 👤 Sofőrök kezelése
- 🗺️ Utak megtekintése és részletek
- ⛽ Üzemanyag-naplók kezelése
- 🔧 Szervizkérelmek kezelése és jóváhagyása
- 🔔 Értesítések

### Sofőr szerepkör
- 📋 Sofőr irányítópult
- 🛣️ Saját utak és új út rögzítése
- ⛽ Üzemanyag-napló rögzítése
- 🔧 Szervizkérelem leadása
- 👤 Profil beállítások

---

## 💻 Helyi fejlesztői környezet

### Előfeltételek
- [Node.js 20+](https://nodejs.org/)
- npm

### Telepítés és indítás

```bash
# Projekt klónozása
git clone https://github.com/FleetFlow-Zarodolgozat/FleetFlow_frontend.git
cd FleetFlow_frontend/Frontend

# Függőségek telepítése
npm ci

# Fejlesztői szerver indítása
npm run dev
```

Az alkalmazás elérhető lesz a `http://localhost:5174` címen.

### Egyéb parancsok

```bash
# Production build
npm run build

# Build előnézete
npm run preview

# Linter futtatása
npm run lint
```

---

## 🐳 Docker

A projekt kétlépéses (multi-stage) Docker buildet használ: az első lépésben a Node.js image buildeli az alkalmazást, a másodikban az `nginx:alpine` image szolgálja ki a statikus fájlokat.

### Image buildelése

```bash
cd FleetFlow_frontend

docker build -t fleetflow-frontend:latest ./Frontend
```

### Konténer futtatása

```bash
docker run -d \
  --name fleetflow-frontend \
  -p 8080:80 \
  fleetflow-frontend:latest
```

Az alkalmazás ezután elérhető a `http://localhost:8080` címen.

### Dockerfile áttekintése

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

> Az Nginx konfiguráció tartalmaz API proxy beállítást (`/api` útvonal), gzip tömörítést, cache fejléceket és biztonsági fejléceket.

---

## ☸️ Kubernetes

A Kubernetes deployment a `Frontend/deployment.yaml` fájlban van definiálva, és az alábbi erőforrásokat hozza létre:

| Erőforrás | Leírás |
|---|---|
| `Deployment` | 1 replika, RollingUpdate stratégia |
| `Service` | ClusterIP, 80-as port |
| `Certificate` | Let's Encrypt TLS tanúsítvány |
| `Ingress` | Nginx ingress, HTTPS redirect |

### Alkalmazás URL-je

🌐 **https://fleetflow.jcloud.jedlik.cloud**

### Manuális deploy

```bash
# IMAGE_TAG beállítása (pl. a git commit SHA)
export IMAGE_TAG=<commit-sha>

# Deployment alkalmazása a klaszterre
envsubst '$IMAGE_TAG' < Frontend/deployment.yaml | kubectl apply -f -
```

### Deployment jellemzői
- **RollingUpdate** stratégia: `maxSurge: 1`, `maxUnavailable: 0` → leállás nélküli frissítés
- **Readiness probe**: HTTP GET `/` – 5 mp kezdeti késleltetés, 10 mp periódus
- **Liveness probe**: HTTP GET `/` – 10 mp kezdeti késleltetés, 20 mp periódus
- **TLS**: automatikus Let's Encrypt tanúsítvány cert-manager segítségével
- **Image pull**: `ghcr.io/fleetflow-zarodolgozat/fleetflow-frontend:<IMAGE_TAG>`

---

## 🔄 CI/CD

A projekt két GitHub Actions workflow-t használ:

### 1. Node.js CI (`node.js.yml`)
Minden `main` ágra történő push és pull request esetén fut:
- Node.js 20 telepítése
- `npm ci` – függőségek telepítése
- `npm run build` – production build
- Cypress E2E tesztek futtatása

### 2. Frontend Deploy (`deploy.yml`)
Csak `main` ágra történő push esetén fut:
1. Docker image buildelése és pusholása a GitHub Container Registry-be (`ghcr.io`)
2. A régi, tag nélküli image-ek törlése (max. 5 verzió megtartása)
3. `kubectl apply` – frissített deployment alkalmazása a Kubernetes klaszterre

---

## 📁 Projekt struktúra

```
FleetFlow_frontend/
├── Frontend/
│   ├── src/
│   │   ├── components/     # Újrahasználható komponensek (Sidebar, Footer, RouteMap)
│   │   ├── pages/          # Oldalak (Login, Dashboard, Vehicles, stb.)
│   │   ├── contexts/       # React Context (pl. AuthContext)
│   │   ├── services/       # API hívások (Axios)
│   │   └── styles/         # CSS stílusok
│   ├── cypress/            # E2E tesztek
│   ├── Dockerfile          # Multi-stage Docker build
│   ├── deployment.yaml     # Kubernetes manifesztek
│   ├── nginx.conf          # Nginx konfiguráció
│   └── package.json
└── .github/
    └── workflows/
        ├── node.js.yml     # CI workflow
        └── deploy.yml      # Deploy workflow
```