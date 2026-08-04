import type { Registration } from '../lib/types'

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Teilnehmerliste einer Ausfahrt. Zeigt auch, ob die Anmeldung an ein Konto
 * gebunden ist – Gast-Einträge stammen noch aus der Zeit vor der Konto-Pflicht.
 */
export function ParticipantTable({ regs }: { regs: Registration[] }) {
  if (regs.length === 0)
    return <p className="py-6 text-sm text-muted">Für diese Ausfahrt hat sich noch niemand angemeldet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            <th className="py-2 pr-3 w-8">#</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">E-Mail</th>
            <th className="py-2 pr-4">Telefon</th>
            <th className="py-2 pr-4">Notfallkontakt</th>
            <th className="py-2 pr-4">Angemeldet</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {regs.map((r, i) => (
            <tr
              key={r.id}
              className={`border-t border-line align-top ${r.status === 'cancelled' ? 'opacity-50' : ''}`}
            >
              <td className="py-2.5 pr-3 text-muted tabular-nums">{i + 1}</td>
              <td className="py-2.5 pr-4">
                <span className="font-semibold">
                  {r.first_name} {r.last_name}
                </span>
                {!r.user_id && (
                  <span
                    className="ml-2 rounded-full border border-line bg-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted"
                    title="Anmeldung ohne Konto – noch aus der Zeit vor der Konto-Pflicht"
                  >
                    Gast
                  </span>
                )}
              </td>
              <td className="py-2.5 pr-4">
                <a href={`mailto:${r.email}`} className="hover:underline underline-offset-2 break-all">
                  {r.email}
                </a>
              </td>
              <td className="py-2.5 pr-4">
                {r.phone ? (
                  <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="hover:underline underline-offset-2">
                    {r.phone}
                  </a>
                ) : (
                  <span className="text-muted">–</span>
                )}
              </td>
              <td className="py-2.5 pr-4">{r.emergency_contact ?? <span className="text-muted">–</span>}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-muted tabular-nums">
                {formatStamp(r.created_at)}
              </td>
              <td className="py-2.5">
                {r.status === 'confirmed' ? (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-ink">
                    Bestätigt
                  </span>
                ) : (
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold text-muted">
                    Storniert
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
