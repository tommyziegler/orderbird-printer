import { Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react'
import { Printer, Wifi, Network, TrendingUp, Monitor, Star, Activity } from 'lucide-react'
import type { NginxConfig } from '@/types/nginx'
import { cn } from '@/lib/utils'

const UP_COLORS = [
  { chip: 'primary'  as const, dot: '#4fa3f7', dotLight: '#006cc1' },
  { chip: 'success'  as const, dot: '#3fb950', dotLight: '#17a34a' },
  { chip: 'secondary'as const, dot: '#a78bfa', dotLight: '#7c3aed' },
  { chip: 'warning'  as const, dot: '#d29922', dotLight: '#d97706' },
]

function generateBonsData(posCount: number): number[] {
  const seed = new Date().getDate() + new Date().getMonth() * 31
  const rng  = (i: number) => { const x = Math.sin(seed * 7 + i * 13) * 10000; return x - Math.floor(x) }
  const pattern = [1,0,0,0,1,2, 8,14,20,28,42,58, 105,118,88,62,48,55, 82,128,115,88,68,42]
  const scale   = Math.max(1, posCount) / 5
  const now     = new Date().getHours()
  return pattern.map((v, i) => {
    const count = Math.max(0, Math.round(v * scale + (rng(i) * 20 - 10) * scale))
    return i > now ? Math.round(count * 0.35) : count
  })
}

interface Props { config: NginxConfig; dark: boolean }

export function DashboardPanel({ config, dark }: Props) {
  const bonsData  = generateBonsData(config.ipMappings.length)
  const bonsHeute = bonsData.reduce((a, b) => a + b, 0)
  const now       = new Date().getHours()
  const lanCount  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN').length
  const wlanCount = config.ipMappings.filter((m) => m.connectionType === 'WLAN').length

  const cardCls  = dark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const textMain = dark ? 'text-[#e6edf3]' : 'text-[#1a1f36]'
  const textSub  = dark ? 'text-[#8b949e]' : 'text-slate-500'
  const rowHover = dark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'

  return (
    <div className="space-y-6">

      {/* ── KPI row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Monitor className="h-5 w-5" />,    label: 'Kassen',      value: String(config.ipMappings.length), sub: `${lanCount} LAN · ${wlanCount} WLAN`, color: 'text-primary-400',  bg: dark ? 'bg-primary-500/10' : 'bg-primary-50' },
          { icon: <Printer className="h-5 w-5" />,    label: 'Drucker',     value: String(config.upstreams.length),  sub: `${config.upstreams.reduce((n,u)=>n+u.servers.length,0)} Server`, color: 'text-success-400',  bg: dark ? 'bg-success-500/10' : 'bg-success-50' },
          { icon: <TrendingUp className="h-5 w-5" />, label: 'Bons heute',  value: bonsHeute.toLocaleString('de-DE'), sub: `${bonsData[now]} in Stunde ${now}`, color: 'text-secondary-400', bg: dark ? 'bg-secondary-500/10' : 'bg-secondary-50' },
          { icon: <Activity className="h-5 w-5" />,   label: 'Port',        value: `:${config.listenPort}`,          sub: 'TCP Stream aktiv', color: 'text-warning-400', bg: dark ? 'bg-warning-500/10' : 'bg-warning-50' },
        ].map((kpi) => (
          <Card key={kpi.label} className={cn('border shadow-sm', cardCls)} shadow="none">
            <CardBody className="p-4">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-3', kpi.bg, kpi.color)}>
                {kpi.icon}
              </div>
              <p className={cn('text-2xl font-bold font-mono tracking-tight', textMain)}>{kpi.value}</p>
              <p className={cn('text-[12px] font-semibold mt-0.5', textMain)}>{kpi.label}</p>
              <p className={cn('text-[11px] mt-0.5', textSub)}>{kpi.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── Routing map ─────────────────────────────────────── */}
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-col items-start gap-0.5">
          <p className={cn('text-[14px] font-semibold', textMain)}>Kassen → Drucker Routing</p>
          <p className={cn('text-[12px]', textSub)}>Welches Terminal druckt auf welchen Drucker</p>
        </CardHeader>
        <Divider className={dark ? 'bg-[#21262d]' : 'bg-slate-100'} />
        <CardBody className="px-5 py-4 space-y-3">
          {config.upstreams.map((upstream, idx) => {
            const col      = UP_COLORS[idx % UP_COLORS.length]
            const mappings = config.ipMappings.filter((m) => m.upstream === upstream.name)
            const isDefault = upstream.name === config.defaultUpstream

            return (
              <div
                key={upstream.name}
                className={cn('rounded-xl border p-4 transition-colors', rowHover,
                  dark ? 'border-[#21262d]' : 'border-slate-200')}
              >
                {/* Printer row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dark ? col.dot : col.dotLight }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-mono font-semibold text-[13px]', textMain)}>
                          {upstream.name}
                        </span>
                        {isDefault && (
                          <Chip size="sm" color="warning" variant="flat"
                            startContent={<Star className="h-2.5 w-2.5" />}
                            classNames={{ base: 'h-4', content: 'text-[10px] px-1 font-semibold' }}>
                            Standard
                          </Chip>
                        )}
                      </div>
                      <p className={cn('text-[11px] font-mono mt-0.5', textSub)}>
                        {upstream.servers.map((s) => s.address).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <Chip size="sm" color={col.chip} variant="flat"
                    classNames={{ base: 'h-5', content: 'text-[11px] font-medium' }}>
                    {mappings.length} Kasse{mappings.length !== 1 ? 'n' : ''}
                  </Chip>
                </div>

                {/* Terminal chips */}
                {mappings.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pl-5">
                    {mappings.map((m) => {
                      const isWlan = m.connectionType === 'WLAN'
                      const name   = m.name || `Kasse ${m.ip.split('.').pop()}`
                      return (
                        <div
                          key={m.ip}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px]',
                            dark ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-50 border-slate-200'
                          )}
                        >
                          {isWlan
                            ? <Wifi    className="h-3 w-3 text-warning-400" />
                            : <Network className="h-3 w-3 text-success-400" />
                          }
                          <span className={cn('font-semibold', textMain)}>{name}</span>
                          <span className={cn('font-mono', textSub)}>{m.ip}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className={cn('text-[12px] italic pl-5', textSub)}>
                    Keine Kassen zugewiesen
                    {isDefault ? ' — Fallback für alle nicht konfigurierten Terminals' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </CardBody>
      </Card>

      {/* ── Bons / Stunde ───────────────────────────────────── */}
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className={cn('text-[14px] font-semibold', textMain)}>Bons pro Stunde</p>
            <p className={cn('text-[12px]', textSub)}>Heutiger Druckdurchsatz (simuliert)</p>
          </div>
          <Chip size="sm" variant="flat" color="secondary"
            classNames={{ content: 'text-[11px] font-semibold' }}>
            {bonsHeute.toLocaleString('de-DE')} heute
          </Chip>
        </CardHeader>
        <Divider className={dark ? 'bg-[#21262d]' : 'bg-slate-100'} />
        <CardBody className="px-5 py-4">
          <BonsChart data={bonsData} currentHour={now} dark={dark} />
        </CardBody>
      </Card>
    </div>
  )
}

function BonsChart({ data, currentHour, dark }: { data: number[]; currentHour: number; dark: boolean }) {
  const max   = Math.max(...data, 1)
  const W     = 800; const H = 180
  const PL    = 44;  const PB = 28; const PT = 16
  const cW    = W - PL - 8
  const cH    = H - PB - PT
  const slotW = cW / 24
  const barW  = slotW - 3

  const grid  = dark ? '#21262d'   : '#e2e8f0'
  const lbl   = dark ? '#8b949e'   : '#94a3b8'
  const barPast    = dark ? '#1d6fc4' : '#3b82f6'
  const barFuture  = dark ? '#21262d' : '#e2e8f0'
  const barCurrent = dark ? '#4fa3f7' : '#006cc1'
  const annoLine   = dark ? '#4fa3f7' : '#006cc1'

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max))
  const meals = [{ h: 12, label: 'Mittagessen' }, { h: 18, label: 'Abendessen' }]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 360, display: 'block' }}>
        {ticks.map((t) => {
          const y = PT + cH - (t / max) * cH
          return (
            <g key={t}>
              <line x1={PL} y1={y} x2={W-8} y2={y} stroke={grid} strokeWidth={1} />
              <text x={PL-6} y={y+4} fontSize={9} fill={lbl} textAnchor="end">{t}</text>
            </g>
          )
        })}

        {meals.map(({ h, label }) => {
          const x = PL + h * slotW + barW / 2
          return (
            <g key={label}>
              <line x1={x} y1={PT} x2={x} y2={PT+cH} stroke={annoLine} strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.35} />
              <text x={x} y={PT-3} fontSize={8} fill={annoLine} textAnchor="middle" opacity={0.6}>{label}</text>
            </g>
          )
        })}

        {data.map((count, h) => {
          const x    = PL + h * slotW + 1.5
          const bH   = Math.max((count / max) * cH, count > 0 ? 2 : 0)
          const y    = PT + cH - bH
          const isCur = h === currentHour
          const fill = isCur ? barCurrent : h < currentHour ? barPast : barFuture
          const op   = isCur ? 1 : h < currentHour ? 0.75 : 0.5

          return (
            <g key={h}>
              <rect x={x} y={y} width={barW} height={bH} rx={3} fill={fill} opacity={op} />
              {isCur && <rect x={x-1} y={PT+cH+2} width={barW+2} height={3} rx={1.5} fill={barCurrent} />}
            </g>
          )
        })}

        {[0, 4, 8, 12, 16, 20].map((h) => (
          <text key={h} x={PL + h * slotW + barW/2} y={H-8}
            fontSize={10} fill={h === currentHour ? barCurrent : lbl} textAnchor="middle"
            fontWeight={h === currentHour ? '700' : '400'}>
            {`${h}:00`}
          </text>
        ))}

        <text x={PL + currentHour * slotW + barW/2} y={H-8}
          fontSize={10} fill={barCurrent} textAnchor="middle" fontWeight="700">
          jetzt
        </text>
      </svg>
    </div>
  )
}
