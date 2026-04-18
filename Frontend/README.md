# FleetFlow Frontend

FleetFlow egy flottakezelő webalkalmazás frontendje. A felület két fő szerepkörre épül (driver és admin), és a napi üzemeltetéshez szükséges műveleteket támogatja: utak, üzemanyag-naplók, szervizkérések, járművek és sofőrök kezelése, értesítések, profilbeállítások.

## Fő funkciók

- **Hitelesítés**: bejelentkezés, elfelejtett jelszó, jelszó beállítása (JWT token a localStorage-ben)
- **Szerepkör-alapú dashboard**: driver és admin külön dashboarddal
- **Utak**: lista, részletek, új út rögzítése
- **Üzemanyag-naplók**: lista, részletek, új napló rögzítése
- **Szervizkérések**: lista, részletek, státuszok kezelése
- **Admin menedzsment**: sofőrök és járművek kezelése
- **Naptár**: ütemezés és események
- **Értesítések**: olvasatlan jelző a menüben
- **Többnyelvűség**: en, hu, de
- **Sötét mód**: localStorage-ben mentett állapot

## Technológia

- React 19 + Vite 7
- React Router
- React-Bootstrap + egyedi CSS
- Axios
- Leaflet térkép
- React Big Calendar
- Cypress e2e tesztek

## Gyors indítás

1. Függőségek telepítése

```bash
npm install
```

2. Fejlesztői szerver

```bash
npm run dev
```

Alapértelmezett port: `5174`.

## Build és preview

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Cypress (e2e)

```bash
npx cypress open
# vagy
npx cypress run
```

## API és proxy

- Az Axios base URL: `/api`.
- Vite proxy beállítás a backendhez: lásd [vite.config.js](vite.config.js).
- A proxy cél URL-je: `https://fleetflow-zarodolgozat-backend-ressdominik.jcloud.jedlik.cloud`.

## Navigáció és szerepkörök

- Bejelentkezés után a rendszer szerepkör alapján irányít:
	- **Admin** → admin dashboard
	- **Driver** → driver dashboard

Fontosabb útvonalak (nem teljes lista):

- `/dashboard`
- `/trips`, `/add-new-trip`
- `/fuel-logs`, `/add-fuel-log`
- `/service-requests`, `/service-request-details`, `/add-service-request`
- `/drivers`, `/add-driver`, `/drivers/:id/edit`
- `/vehicles`, `/add-vehicle`, `/vehicles/:id/edit`
- `/admin-*` oldalak az admin listákhoz
- `/notifications`
- `/profile-settings`
- `/terms`, `/privacy`, `/help`

## Lokális beállítások

- Nyelv: `fleetflow_language` (driver esetén mentés `fleetflow_language_driver` kulcsba is)
- Sötét mód: `fleetflow_darkMode`
- Hitelesítés: `authToken` és `user`

## Projekt struktúra (röviden)

- [src/pages](src/pages) – oldalak
- [src/components](src/components) – megosztott komponensek
- [src/services](src/services) – API és auth szolgáltatások
- [src/styles](src/styles) – egyedi stílusok
- [cypress](cypress) – e2e tesztek

## Megjegyzések

- A legtöbb hiba és siker üzenet egyedi `CustomModal` komponensen keresztül jelenik meg.
- A témaváltás esemény alapú (`theme-change`) és localStorage-ben tárolódik.
