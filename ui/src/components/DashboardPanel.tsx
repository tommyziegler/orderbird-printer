import { Printer, Wifi, Network, TrendingUp, Monitor, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NginxConfig } from '@/types/nginx'

// Per-upstream accent colours
const UPSTREAM_COLORS = [
  { primary: 'hsl(217,91%,60%)', text: 'hsl(217,91%,68%)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
  { primary: 'hsl(160,60%,45%)', text: 'hsl(160,60%,55%)', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)'  },
  { primary: 'hsl(265,80%,65%)', text: 'hsl(265,80%,72%)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)' },
  { primary: 'hsl(35,90%,55%)',  text: 'hsl(35,90%,62%)',  bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
]

// Generate realistic restaurant Bon-data, seeded by calendar-day so it
// stays consistent during the same day but varies day-to-day.
function generateBonsData(posCount: number): number[] {
  const seed = new Date().getDate() + new Date().getMonth() * 31
  const rng = (i: number) => {
    const x = Math.sin(seed * 7 + i * 13) * 10000
    return x - Math.floor(x)
  }
  // Typical restaurant pattern (0h … 23h)
  const pattern = [
    1, 0, 0, 0, 1, 2,
    8, 14, 20, 28, 42, 58,
    105, 118, 88, 62, 48, 55,
    82, 128, 115, 88, 68, 42,
  ]
  const scale = Math.max(1, posCount) / 5
  const currentHour = new Date().getHours()
  return pattern.map((v, i) => {
    const jitter = (rng(i) * 20 - 10) * scale
    const count = Math.max(0, Math.round(v * scale + jitter))
    // Future hours: show a faded estimate
    return i > currentHour ? Math.round(count * 0.35) : count
  })
}

interface DashboardPanelProps {
  config: NginxConfig
}

export function DashboardPanel({ config }: DashboardPanelProps) {
  const bonsData = generateBonsData(config.ipMappings.length)
  const bonsHeute = bonsData.reduce((a, b) => a + b, 0)
  const currentHour = new Date().getHours()
  const bonsJetzt = bonsData[currentHour]

  const lanCount  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN').length
  const wlanCount = config.ipMappings.filter((m) => m.connectionType === 'WLAN').length

  return (
    <div className="space-y-6">
      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Monitor className="h-5 w-5" />}
          label="Kassen"
          value={String(config.ipMappings.length)}
          sub={`${lanCount} LAN · ${wlanCount} WLAN`}
          color={UPSTREAM_COLORS[0]}
        />
        <StatCard
          icon={<Printer className="h-5 w-5" />}
          label="Drucker"
          value={String(config.upstreams.length)}
          sub={`${config.upstreams.reduce((n, u) => n + u.servers.length, 0)} Server gesamt`}
          color={UPSTREAM_COLORS[1]}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Bons heute"
          value={bonsHeute.toLocaleString('de-DE')}
          sub={`${bonsJetzt} in Stunde ${currentHour}`}
          color={UPSTREAM_COLORS[2]}
        />
        <StatCard
          icon={<Network className="h-5 w-5" />}
          label="Port"
          value={`:${config.listenPort}`}
          sub="TCP Stream aktiv"
          color={UPSTREAM_COLORS[3]}
        />
      </div>

      {/* ── Routing Visualisierung ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">Kassen → Drucker Routing</CardTitle>
          <CardDescription className="text-xs">
            Welcher POS-Terminal druckt auf welchen Drucker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.upstreams.map((upstream, idx) => {
            const color    = UPSTREAM_COLORS[idx % UPSTREAM_COLORS.length]
            const mappings = config.ipMappings.filter((m) => m.upstream === upstream.name)
            const isDefault = upstream.name === config.defaultUpstream

            return (
              <div
                key={upstream.name}
                className="rounded-xl border p-4 transition-colors"
                style={{ borderColor: color.border, backgroundColor: color.bg }}
              >
                {/* Printer header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${color.primary}20` }}
                    >
                      <Printer className="h-4 w-4" style={{ color: color.text }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm" style={{ color: color.text }}>
                          {upstream.name}
                        </span>
                        {isDefault && (
                          <Badge variant="warning" className="text-[10px] h-4 px-1.5 gap-1">
                            <Star className="h-2.5 w-2.5" />
                            Standard
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                        {upstream.servers.map((s) => s.address).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {mappings.length} Kasse{mappings.length !== 1 ? 'n' : ''}
                  </span>
                </div>

                {/* POS Terminal chips */}
                {mappings.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mappings.map((mapping) => {
                      const isWlan = mapping.connectionType === 'WLAN'
                      const displayName = mapping.name || `Kasse ${mapping.ip.split('.').pop()}`
                      return (
                        <div
                          key={mapping.ip}
                          className="flex items-center gap-2 rounded-lg border bg-[hsl(var(--card))] px-3 py-2"
                          style={{ borderColor: color.border }}
                        >
                          <div className="flex items-center gap-1.5">
                            {isWlan
                              ? <Wifi    className="h-3.5 w-3.5 text-[hsl(38,90%,55%)]" />
                              : <Network className="h-3.5 w-3.5 text-[hsl(160,60%,50%)]" />
                            }
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: isWlan ? 'hsl(38,90%,55%)' : 'hsl(160,60%,50%)' }}
                            >
                              {isWlan ? 'WLAN' : 'LAN'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-none">{displayName}</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                              {mapping.ip}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                    Keine Kassen zugewiesen
                    {isDefault ? ' — empfängt alle nicht explizit konfigurierten Kassen' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Bons pro Stunde ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold">Bons pro Stunde</CardTitle>
              <CardDescription className="text-xs">
                Heutiger Druckdurchsatz — simuliert aus Log-Struktur
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold">
              {bonsHeute.toLocaleString('de-DE')} Bons heute
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <BonsChart data={bonsData} currentHour={currentHour} />
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: { primary: string; text: string; bg: string; border: string }
}) {
  return (
    <Card className="overflow-hidden" style={{ borderColor: color.border }}>
      <CardContent className="p-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
          style={{ background: color.bg, color: color.text }}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-[hsl(var(--foreground))] mt-0.5">{label}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function BonsChart({ data, currentHour }: { data: number[]; currentHour: number }) {
  const max  = Math.max(...data, 1)
  const W    = 800
  const H    = 190
  const PAD_L = 46
  const PAD_B = 28
  const PAD_T = 14
  const chartW = W - PAD_L - 8
  const chartH = H - PAD_B - PAD_T
  const slotW  = chartW / 24
  const barW   = slotW - 3

  // Y-axis ticks: 0, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max))

  // Meal-time labels
  const annotations: { hour: number; label: string }[] = [
    { hour: 12, label: 'Mittagessen' },
    { hour: 18, label: 'Abendessen' },
  ]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ minWidth: '360px', display: 'block' }}
      >
        {/* Grid lines */}
        {ticks.map((tick) => {
          const y = PAD_T + chartH - (tick / max) * chartH
          return (
            <g key={tick}>
              <line
                x1={PAD_L} y1={y} x2={W - 8} y2={y}
                stroke="hsl(217,30%,12%)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 6} y={y + 4}
                fontSize={9} fill="hsl(215,20%,40%)" textAnchor="end"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* Meal-time annotation lines */}
        {annotations.map(({ hour, label }) => {
          const x = PAD_L + hour * slotW + barW / 2
          return (
            <g key={label}>
              <line
                x1={x} y1={PAD_T} x2={x} y2={PAD_T + chartH}
                stroke="hsl(217,91%,60%)" strokeWidth={1}
                strokeDasharray="3 3" strokeOpacity={0.3}
              />
              <text
                x={x} y={PAD_T - 3}
                fontSize={8} fill="hsl(217,91%,60%)" textAnchor="middle"
                opacity={0.6}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((count, hour) => {
          const x     = PAD_L + hour * slotW + 1.5
          const barH  = Math.max((count / max) * chartH, count > 0 ? 2 : 0)
          const y     = PAD_T + chartH - barH
          const isCurrent = hour === currentHour
          const isPast    = hour < currentHour

          let fill: string, opacity: number
          if (isCurrent)   { fill = 'hsl(217,91%,68%)'; opacity = 1 }
          else if (isPast) { fill = 'hsl(217,91%,52%)'; opacity = 0.75 }
          else             { fill = 'hsl(217,40%,28%)'; opacity = 0.4 }

          return (
            <g key={hour}>
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={fill} opacity={opacity} />
              {isCurrent && (
                <rect
                  x={x - 1} y={PAD_T + chartH + 2}
                  width={barW + 2} height={3} rx={1.5}
                  fill="hsl(217,91%,68%)"
                />
              )}
            </g>
          )
        })}

        {/* X-axis hour labels */}
        {[0, 4, 8, 12, 16, 20].map((h) => (
          <text
            key={h}
            x={PAD_L + h * slotW + barW / 2}
            y={H - 8}
            fontSize={10}
            fill={h === currentHour ? 'hsl(217,91%,65%)' : 'hsl(215,20%,42%)'}
            textAnchor="middle"
          >
            {h === 0 ? '0:00' : `${h}:00`}
          </text>
        ))}

        {/* "Jetzt" label above current bar */}
        <text
          x={PAD_L + currentHour * slotW + barW / 2}
          y={H - 8}
          fontSize={10}
          fill="hsl(217,91%,68%)"
          textAnchor="middle"
          fontWeight="700"
        >
          jetzt
        </text>
      </svg>
    </div>
  )
}
