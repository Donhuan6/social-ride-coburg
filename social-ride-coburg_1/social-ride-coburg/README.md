# Social Ride Coburg – Web App

Community-Plattform für Group Rides: Rides entdecken, anmelden, verwalten.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Framer Motion + Leaflet + Supabase (Auth, Datenbank, Storage)

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:5173. Die Supabase-Zugangsdaten liegen in `.env` (der Publishable Key ist öffentlich und darf im Frontend stehen – die Sicherheit kommt von Row Level Security in der Datenbank).

## Produktions-Build

```bash
npm run build      # erzeugt dist/
npm run preview    # lokale Vorschau des Builds
```

## Online stellen

Die Konfiguration für Netlify (`netlify.toml`, `public/_redirects`) und Vercel (`vercel.json`) liegt bereits im Projekt – inklusive der Regel „alle Pfade → /index.html", ohne die Unterseiten wie `/rides` beim direkten Aufruf einen 404 liefern würden.

**Schnellster Weg (ohne Konto, ~30 Sekunden):** `npm run build` ausführen, den Inhalt des Ordners `dist` als ZIP packen und auf https://app.netlify.com/drop ziehen. Es gibt sofort eine öffentliche Adresse. Mit kostenlosem Konto lässt sich der Name ändern und die Seite dauerhaft behalten.

**Mit automatischer Aktualisierung (empfohlen):** Dieses Verzeichnis ist bereits ein Git-Repository mit einem ersten Commit. Ein leeres Repository auf GitHub anlegen (ohne README, ohne .gitignore) und dann:

```bash
git remote add origin https://github.com/DEIN-NAME/social-ride-coburg.git
git push -u origin main
```

Anschließend bei Vercel unter *Add New → Project* das Repository importieren. Build-Command `npm run build`, Output-Verzeichnis `dist` – beides erkennt Vercel automatisch. Ab dann wird jeder Push auf `main` selbstständig gebaut und veröffentlicht.

Wer lieber ohne Terminal arbeitet: GitHub Desktop öffnen, *Add Local Repository*, diesen Ordner wählen, *Publish repository*.

Wenn eine eigene Domain dazukommt, muss sie zusätzlich in Supabase unter Authentication → URL Configuration als „Site URL" bzw. „Redirect URL" eingetragen werden – sonst zeigen die Links in Bestätigungs- und Passwort-Mails weiterhin auf localhost.

## Admin werden

Es gibt eine Allowlist: Wer sich mit einer dort eingetragenen E-Mail registriert, wird **automatisch** Admin. `timonmayer97@gmail.com` ist bereits eingetragen. Weitere Personen aufnehmen (Supabase → SQL Editor):

```sql
insert into admin_allowlist (email) values ('neue.person@mail.de');
```

Ein bereits bestehendes Konto nachträglich zum Admin machen:

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'DEINE@MAIL.de');
```

Als Admin erscheint „Admin" in der Navigation, mit drei Bereichen:

- **Statistiken** – Anmeldungen der letzten Wochen, beliebteste Ausfahrten
- **Ausfahrten** – anlegen (Formular mit Live-Vorschau), bearbeiten, duplizieren, löschen, Anmeldung öffnen/schließen, Cover- & GPX-Upload
- **Teilnehmer** – alle Anmeldungen über alle Ausfahrten hinweg, nach Ausfahrt gruppiert, mit Suche über Name/E-Mail/Telefon, Filter nach Ausfahrt, Zeitraum und Status, CSV-Export und Sammel-E-Mail

## Anmeldung nur mit Konto

Zur Teilnahme an einer Ausfahrt ist ein kostenloses Konto nötig. Wer ausgeloggt auf „Anmelden & mitfahren" klickt, wird zur Registrierung geleitet und danach automatisch zur Ausfahrt zurückgebracht.

Durchgesetzt wird das in der Datenbank, nicht nur im Frontend: Die INSERT-Regel auf `registrations` verlangt `user_id = auth.uid()`. Anonyme Aufrufe haben keine `auth.uid()` und scheitern dort. Ebenso geprüft werden die drei Einwilligungen, ob die Anmeldung offen ist und ob noch Plätze frei sind – Letzteres über die Funktion `ride_confirmed_count()`, weil eine direkte Zählung nur die eigenen Zeilen sähe.

Anmeldungen aus der Zeit davor bleiben erhalten und sind in der Teilnehmer-Übersicht als **Gast** gekennzeichnet.

## Hero-Video

Der Startseiten-Hero zeigt `public/hero.mp4` als Endlosschleife (stumm, ohne Ton-Spur, 10 s, ~1 MB) mit `public/hero-poster.jpg` als Standbild fürs sofortige Laden. Mobil läuft das Video vollflächig im Hochformat, ab Tablet sitzt es rechts und wird über eine unscharfe Füllung nach links ausgeblendet – so bleibt die Schrift lesbar, ohne das Bild zu überdecken.

Wer ein anderes Video einsetzen will, ersetzt einfach beide Dateien. Für ein sauberes Ergebnis lohnt sich vorher:

```bash
ffmpeg -i original.mp4 -t 12 -an -c:v libx264 -profile:v main \
  -pix_fmt yuv420p -crf 30 -preset slow -movflags +faststart hero.mp4
ffmpeg -i hero.mp4 -ss 3 -frames:v 1 -vf scale=432:-2 -q:v 6 hero-poster.jpg
```

Wichtig sind `-an` (kein Ton, sonst blockieren Browser den Autostart) und `+faststart` (Video beginnt sofort, statt erst komplett zu laden). Bei Nutzern mit der Systemeinstellung „Bewegung reduzieren" zeigt die Seite automatisch nur das Standbild.

## Logo

Das Original-Logo liegt als Vektor in `src/components/Logo.tsx` (aus der Originaldatei getract, nutzt `currentColor` – funktioniert dadurch auf hellem und dunklem Grund). Die Quell-SVG liegt zusätzlich unter `src/assets/logo-src.svg`, das Favicon unter `public/favicon.svg`.

## Datenbank (Supabase-Projekt `social-riders-coburg`, EU Frankfurt)

- `profiles` – Nutzerprofile (auto-erstellt bei Registrierung), `is_admin`-Flag
- `rides` – alle Ride-Daten (Titel, Slug, Datum, Treffpunkt + Koordinaten, Distanz, Höhenmeter, Tempo, Level, Bike-Typen, Beschreibung, Hinweise, GPX, Max. Teilnehmer, Status, Tags)
- `registrations` – Anmeldungen (auch ohne Konto möglich); DB erzwingt: Checkboxen akzeptiert, Anmeldung offen, nicht ausgebucht, E-Mail nur 1× pro Ride
- `saved_rides` – gemerkte Rides
- Storage-Buckets: `covers`, `gpx`, `avatars`
- Row Level Security überall aktiv: Rides öffentlich lesbar, schreiben nur Admins; Anmeldungen sieht nur der Nutzer selbst bzw. Admins

## Noch offen / Ideen

- **Bestätigungs-E-Mail** nach Ride-Anmeldung: braucht eine Supabase Edge Function + E-Mail-Dienst (z. B. Resend, kostenloser Tier reicht). Aktuell zeigt die App die Bestätigung im UI.
- Original-Logo als SVG/PNG einbinden (aktuell: Vektor-Nachbau in `src/components/Logo.tsx`)
- Echte Radsport-Fotografie fürs Hero & Cover-Bilder (Admin kann Cover hochladen)
- Zukunft: Wiederkehrende Rides, Warteliste, Strava-Integration, Wetter-Widget

## Rechtliches

Impressum, Datenschutz und Haftungsausschluss enthalten Platzhalter in [eckigen Klammern] – vor Veröffentlichung ausfüllen und idealerweise prüfen lassen.
