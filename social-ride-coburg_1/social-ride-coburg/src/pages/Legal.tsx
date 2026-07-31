function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="label">Rechtliches</p>
      <h1 className="display not-italic text-3xl md:text-4xl">{title}</h1>
      <div className="card mt-8 p-6 md:p-10 space-y-5 text-[15px] leading-relaxed text-ink/80 [&_h2]:font-bold [&_h2]:text-ink [&_h2]:text-lg [&_h2]:mt-2">
        {children}
      </div>
    </div>
  )
}

export function Impressum() {
  return (
    <LegalShell title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Social Ride Coburg<br />
        [Vorname Nachname des Verantwortlichen]<br />
        [Straße Hausnummer]<br />
        [PLZ] Coburg
      </p>
      <h2>Kontakt</h2>
      <p>E-Mail: [kontakt@social-ride-coburg.com]</p>
      <h2>Hinweis</h2>
      <p>
        Social Ride Coburg ist eine private, nicht-kommerzielle Radsport-Community. Die
        Teilnahme an den Ausfahrten ist kostenlos und erfolgt auf eigene Gefahr.
      </p>
      <p className="text-sm text-muted">
        Platzhalter in eckigen Klammern bitte vor Veröffentlichung mit echten Angaben ersetzen.
      </p>
    </LegalShell>
  )
}

export function Datenschutz() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist: [Vorname Nachname,
        Anschrift, E-Mail] – siehe Impressum.
      </p>
      <h2>2. Welche Daten wir verarbeiten</h2>
      <p>
        Bei der Anmeldung zu einem Ride verarbeiten wir: Vorname, Nachname, E-Mail-Adresse sowie
        optional Telefonnummer und Notfallkontakt. Bei der Registrierung eines Kontos zusätzlich
        Profilangaben (Bike-Typ, Erfahrung, Instagram). Die Daten dienen ausschließlich der
        Organisation und Durchführung der Ausfahrten.
      </p>
      <h2>3. Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Durchführung der
        Teilnahme) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
      </p>
      <h2>4. Hosting &amp; Auftragsverarbeitung</h2>
      <p>
        Diese Anwendung wird über Supabase (Datenbank &amp; Authentifizierung, Serverstandort EU –
        Frankfurt) betrieben. Kartenmaterial wird von OpenStreetMap geladen; dabei wird deine
        IP-Adresse an OpenStreetMap übertragen.
      </p>
      <h2>5. Speicherdauer</h2>
      <p>
        Anmeldedaten zu Rides werden nach Durchführung des Rides innerhalb von [90 Tagen]
        gelöscht, sofern kein Konto besteht. Kontodaten bleiben bis zur Löschung des Kontos
        gespeichert.
      </p>
      <h2>6. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit sowie Widerruf erteilter Einwilligungen. Wende dich dazu an die im
        Impressum genannte Adresse. Beschwerderecht: zuständige Datenschutzaufsichtsbehörde
        (BayLDA).
      </p>
      <p className="text-sm text-muted">
        Diese Vorlage ersetzt keine Rechtsberatung. Bitte vor Veröffentlichung prüfen (lassen).
      </p>
    </LegalShell>
  )
}

export function Haftungsausschluss() {
  return (
    <LegalShell title="Haftungsausschluss">
      <h2>Teilnahme auf eigene Gefahr</h2>
      <p>
        Die Teilnahme an allen Ausfahrten von Social Ride Coburg erfolgt freiwillig und auf
        eigene Gefahr. Jede Teilnehmerin und jeder Teilnehmer ist für die eigene Sicherheit, die
        Verkehrstauglichkeit des Rades und die Einhaltung der Straßenverkehrsordnung (StVO)
        selbst verantwortlich.
      </p>
      <h2>Keine Veranstalterhaftung</h2>
      <p>
        Die Organisatoren übernehmen keine Haftung für Personen-, Sach- oder Vermögensschäden,
        die im Zusammenhang mit der Teilnahme an einer Ausfahrt entstehen, soweit gesetzlich
        zulässig. Dies gilt nicht für Schäden aus der Verletzung von Leben, Körper oder
        Gesundheit, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung beruhen.
      </p>
      <h2>Empfehlungen</h2>
      <p>
        Wir empfehlen dringend das Tragen eines Helms, eine private Haftpflichtversicherung sowie
        eine dem Wetter und der Strecke angemessene Ausrüstung. Die Rides sind keine
        Rennveranstaltungen – es gilt die StVO.
      </p>
      <h2>Minderjährige</h2>
      <p>
        Minderjährige dürfen nur in Begleitung eines Erziehungsberechtigten oder mit dessen
        schriftlicher Einverständniserklärung teilnehmen.
      </p>
      <p className="text-sm text-muted">
        Diese Vorlage ersetzt keine Rechtsberatung. Bitte vor Veröffentlichung prüfen (lassen).
      </p>
    </LegalShell>
  )
}
