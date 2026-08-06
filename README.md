# Social Ride Coburg – Web App

Community-Plattform für Group Rides in und um Coburg: Rides entdecken, anmelden, verwalten.

**Live:** https://social-ride-coburg.com

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · Leaflet · Supabase (Auth, Datenbank, Storage)

## Lokal starten

Voraussetzung: Node 20 oder neuer.

```bash
npm ci
npm run dev
```

Die App läuft dann auf http://localhost:5173.

Weitere Befehle:

```bash
npm run build     # Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
npm run lint      # oxlint
```

## Environment-Variablen

`.env.example` nach `.env` kopieren und ausfüllen. Nur Variablen mit dem Präfix
`VITE_` landen im Frontend-Build:

| Variable | Bedeutung |
| --- | --- |
| `VITE_SUPABASE_URL` | URL des Supabase-Projekts |
| `VITE_SUPABASE_ANON_KEY` | Publishable Key (öffentlich, Schutz kommt aus Row Level Security) |

Beide haben in `src/lib/supabase.ts` Fallback-Werte, damit die App auch ohne `.env`
startet. Der Service-Role-Key gehört niemals ins Frontend oder ins Repository.

## Projektstruktur

```
index.html            Einstiegspunkt von Vite
vite.config.ts        Vite-Konfiguration (React + Tailwind Plugin)
tsconfig*.json        TypeScript-Projektreferenzen
vercel.json           Rewrites (SPA) und Security-Header
public/               Statische Dateien, werden 1:1 ausgeliefert
src/
  components/         Wiederverwendbare UI-Bausteine
  context/            AuthContext
  lib/                Supabase-Client, Datenzugriff, Typen, Formatierung
  pages/              Seiten inkl. admin/, auth/, dashboard/
```

## Deployment

Hosting läuft auf Vercel, jeder Push auf `main` baut automatisch.

Wichtig: **Root Directory muss in den Vercel-Projekteinstellungen leer sein**
(Settings → Build and Deployment). Die App liegt im Wurzelverzeichnis des
Repositories, nicht in einem Unterordner. Framework Preset: `Vite`.

`vercel.json` wird aus dem Root Directory gelesen — eine Kopie unter `public/`
hätte keine Wirkung.

## Bekannte Eigenheiten

- React ist bewusst auf `19.1.1` festgenagelt; 19.2.x hat einen Regression-Bug.
- `StrictMode` ist deaktiviert.
- Der `useEffect` in `App.tsx` gibt bewusst nichts zurück — manche
  Browser-Erweiterungen überschreiben `window.scrollTo` und lösen sonst
  „destroy is not a function" aus.
- `dist/` gehört nicht ins Repository: ein eingecheckter Build verfälscht die
  Klassen-Erkennung von Tailwind 4 und erzeugt überflüssiges CSS.
