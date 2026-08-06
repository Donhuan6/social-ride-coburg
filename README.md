# Social Ride Coburg – Web App

Live: https://social-ride-coburg.com

Stack
- React 19 (genau 19.1.1)
- TypeScript
- Vite
- Tailwind CSS 4
- Framer Motion
- Leaflet
- Supabase

Lokales Starten
1. Node 20+ installieren
2. npm ci
3. npm run dev (läuft standardmäßig auf Port 5173)

Weitere Befehle
- npm run build
- npm run preview
- npm run lint

Environment-Variablen
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
(Die Datei `src/lib/supabase.ts` enthält Fallback-Werte. Der Service-Role-Key darf niemals ins Frontend oder ins Repo.)

Projektstruktur (Wurzelverzeichnis)
- index.html
- vite.config.ts
- tsconfig.json / tsconfig.app.json / tsconfig.node.json
- vercel.json
- package.json / package-lock.json
- public/
- src/
  - components/
  - context/
  - lib/
  - pages/

Deployment
- Plattform: Vercel
- Jeder Push auf main baut automatisch
- Root Directory muss leer sein (Framework Preset: Vite)

Bekannte Eigenheiten
- React ist absichtlich auf 19.1.1 festgenagelt (19.2.x enthält eine Regression).
- StrictMode ist deaktiviert.
- In App.tsx gibt ein useEffect bewusst nichts zurück, um Probleme mit Browser-Extensions (z. B. überschriebenes window.scrollTo → "destroy is not a function") zu vermeiden.
- dist/ gehört nicht ins Repository (ein eingecheckter Build verfälscht die Klassen-Erkennung von Tailwind 4).
