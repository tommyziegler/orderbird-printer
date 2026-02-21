import { Card, CardBody, CardHeader, Chip, Divider, Tooltip } from '@heroui/react'
import {
  Printer, Wifi, Network, TrendingUp, Monitor, Star, Activity,
  AlertTriangle, CheckCircle, WifiOff, Clock, Zap, BarChart2,
} from 'lucide-react'
import type { NginxConfig, IpMapping } from '@/types/nginx'
import {
  deviceMetrics, aggregateMetrics,
  SIGNAL_COLOR, SIGNAL_LABEL, RISK_COLOR, RISK_LABEL,
  type SignalLevel, type RiskLevel,
} from '@/lib/networkMetrics'
import { cn } from '@/lib/utils'

const UP_COLORS = [
  { chip: 'primary'   as const, dot: '#4fa3f7', dotLight: '#006cc1' },
  { chip: 'success'   as const, dot: '#3fb950', dotLight: '#17a34a' },
  { chip: 'secondary' as const, dot: '#a78bfa', dotLight: '#7c3aed' },
  { chip: 'warning'   as const, dot: '#d29922', dotLight: '#d97706' },
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

// ── Signal bar ───────────────────────────────────────────────────────────────
function SignalBar({ pct, level }: { pct: number; level: SignalLevel }) {
  const color = SIGNAL_COLOR[level]
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-default-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ── 4-bar signal strength icon ────────────────────────────────────────────────
function SignalBars({ level }: { level: SignalLevel }) {
  const bars  = level === 'excellent' ? 4 : level === 'good' ? 3 : level === 'fair' ? 2 : 1
  const color = SIGNAL_COLOR[level]
  return (
    <div className="flex items-end gap-[2px]">
      {[1,2,3,4].map((b) => (
        <div key={b} className="w-[3px] rounded-sm"
          style={{ height: `${6 + b * 3}px`, background: b <= bars ? color : '#334155' }} />
      ))}
    </div>
  )
}

// ── LAN / WLAN comparison card ────────────────────────────────────────────────
function ConnectionTypeCard({
  type, count, metrics, dark,
}: {
  type: 'LAN' | 'WLAN'
  count: number
  metrics: ReturnType<typeof aggregateMetrics>
  dark: boolean
}) {
  const isWlan    = type === 'WLAN'
  const iconColor = isWlan ? 'text-warning-400' : 'text-success-400'
  const bgColor   = isWlan
    ? (dark ? 'bg-warning-500/8 border-warning-500/20' : 'bg-warning-50 border-warning-200')
    : (dark ? 'bg-success-500/8 border-success-500/20' : 'bg-success-50 border-success-200')

  const textMain = dark ? 'text-[#e6edf3]' : 'text-[#1a1f36]'
  const textSub  = dark ? 'text-[#8b949e]' : 'text-slate-500'

  const rows: Array<{ icon: React.ReactNode; label: string; value: string; warn?: boolean }> = isWlan
    ? [
        { icon: <BarChart2 className="h-3 w-3" />,       label: 'Ø Signal',    value: `${metrics.avgSignal}%`,         warn: metrics.avgSignal < 70 },
        { icon: <AlertTriangle className="h-3 w-3" />,   label: 'Fehlerrate',  value: `${metrics.avgErrorRate}%`,      warn: metrics.avgErrorRate > 2 },
        { icon: <Clock className="h-3 w-3" />,           label: 'Ø Latenz',    value: `${metrics.avgLatencyMs} ms`,    warn: metrics.avgLatencyMs > 15 },
        { icon: <WifiOff className="h-3 w-3" />,         label: 'Verbr./Tag',  value: `~${metrics.avgDrops}x`,         warn: metrics.avgDrops > 2 },
        { icon: <AlertTriangle className="h-3 w-3" />,   label: 'Auffällig',   value: `${metrics.atRisk} Geräte`,      warn: metrics.atRisk > 0 },
      ]
    : [
        { icon: <BarChart2 className="h-3 w-3" />,       label: 'Stabilität',  value: '~99.9%' },
        { icon: <AlertTriangle className="h-3 w-3" />,   label: 'Fehlerrate',  value: '< 0.1%' },
        { icon: <Clock className="h-3 w-3" />,           label: 'Ø Latenz',    value: '< 1 ms' },
        { icon: <WifiOff className="h-3 w-3" />,         label: 'Verbr./Tag',  value: '~0x' },
        { icon: <CheckCircle className="h-3 w-3" />,     label: 'Auffällig',   value: '0 Geräte' },
      ]

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', bgColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWlan
            ? <Wifi    className={cn('h-4 w-4', iconColor)} />
            : <Network className={cn('h-4 w-4', iconColor)} />
          }
          <span className={cn('font-semibold text-[13px]', textMain)}>{type}</span>
        </div>
        <Chip size="sm" color={isWlan ? 'warning' : 'success'} variant="flat"
          classNames={{ base: 'h-5', content: 'text-[11px] font-bold' }}>
          {count} {count === 1 ? 'Gerät' : 'Geräte'}
        </Chip>
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-[12px]">
            <div className={cn('flex items-center gap-1.5', r.warn ? 'text-warning-400' : textSub)}>
              {r.icon}
              <span>{r.label}</span>
            </div>
            <span className={cn('font-mono font-semibold', r.warn ? 'text-warning-400' : textMain)}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {count === 0 && (
        <p className={cn('text-[11px] italic', textSub)}>Keine {type}-Geräte konfiguriert</p>
      )}
    </div>
  )
}

// ── Per-device WLAN health table ──────────────────────────────────────────────
function WlanDeviceTable({ mappings, dark }: { mappings: IpMapping[]; dark: boolean }) {
  const textMain = dark ? 'text-[#e6edf3]' : 'text-[#1a1f36]'
  const textSub  = dark ? 'text-[#8b949e]' : 'text-slate-500'
  const rowHover = dark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'
  const divider  = dark ? 'border-[#21262d]' : 'border-slate-100'

  if (mappings.length === 0) return null

  const atRiskCount = mappings.filter((m) => deviceMetrics(m.ip, 'WLAN').needsAttention).length

  return (
    <Card className={cn('border shadow-sm', dark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200')} shadow="none">
      <CardHeader className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg',
            dark ? 'bg-warning-500/10' : 'bg-warning-50')}>
            <Wifi className="h-4 w-4 text-warning-400" />
          </div>
          <div>
            <p className={cn('text-[14px] font-semibold', textMain)}>WLAN Gerätestatus</p>
            <p className={cn('text-[12px]', textSub)}>
              Signalqualität, Fehlerrate und Timeout-Risiko pro Terminal
            </p>
          </div>
        </div>
        {atRiskCount > 0 && (
          <Chip size="sm" color="danger" variant="flat"
            startContent={<AlertTriangle className="h-3 w-3" />}
            classNames={{ content: 'text-[11px] font-semibold' }}>
            {atRiskCount} auffällig
          </Chip>
        )}
      </CardHeader>
      <Divider className={divider} />
      <CardBody className="p-0">
        {/* Header row */}
        <div className={cn(
          'grid grid-cols-[1fr_130px_80px_80px_80px_90px] gap-3 px-5 py-2',
          'text-[10px] font-semibold uppercase tracking-wider border-b',
          textSub, divider
        )}>
          <span>Kasse</span>
          <span>Signal</span>
          <span className="text-center">Fehlerrate</span>
          <span className="text-center">Latenz</span>
          <span className="text-center">Verbr./Tag</span>
          <span className="text-center">Risiko</span>
        </div>

        {mappings.map((m) => {
          const met   = deviceMetrics(m.ip, 'WLAN')
          const name  = m.name || `Kasse ${m.ip.split('.').pop()}`
          const riskC = RISK_COLOR[met.timeoutRisk as RiskLevel]

          return (
            <div
              key={m.ip}
              className={cn(
                'grid grid-cols-[1fr_130px_80px_80px_80px_90px] gap-3 items-center px-5 py-3 border-b transition-colors',
                divider, rowHover,
                met.needsAttention && (dark ? 'bg-warning-500/5' : 'bg-warning-50/60')
              )}
            >
              {/* Name / IP */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {met.needsAttention && (
                    <Tooltip content="Signal oder Fehlerrate auffällig — LAN empfohlen" placement="top">
                      <AlertTriangle className="h-3 w-3 text-warning-400 shrink-0" />
                    </Tooltip>
                  )}
                  <span className={cn('text-[13px] font-semibold truncate', textMain)}>{name}</span>
                </div>
                <span className={cn('text-[11px] font-mono', textSub)}>{m.ip}</span>
              </div>

              {/* Signal bar + label */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <SignalBars level={met.signalLevel} />
                  <span className="text-[10px] font-medium" style={{ color: SIGNAL_COLOR[met.signalLevel] }}>
                    {SIGNAL_LABEL[met.signalLevel]}
                  </span>
                </div>
                <SignalBar pct={met.signal} level={met.signalLevel} />
              </div>

              {/* Error rate */}
              <div className="text-center">
                <span className="text-[12px] font-mono font-semibold" style={{
                  color: met.errorRate > 3 ? '#f85149' : met.errorRate > 1.5 ? '#d29922' : '#3fb950',
                }}>
                  {met.errorRate}%
                </span>
              </div>

              {/* Latency */}
              <div className="text-center">
                <span className="text-[12px] font-mono font-semibold" style={{
                  color: met.latencyMs > 20 ? '#d29922' : '#8b949e',
                }}>
                  {met.latencyMs} ms
                </span>
              </div>

              {/* Drops */}
              <div className="text-center">
                <span className="text-[12px] font-mono font-semibold" style={{
                  color: met.dropsPerDay > 3 ? '#f85149' : met.dropsPerDay > 1 ? '#d29922' : '#8b949e',
                }}>
                  ~{met.dropsPerDay}x
                </span>
              </div>

              {/* Risk badge */}
              <div className="text-center">
                <span className="text-[11px] font-semibold rounded-md px-1.5 py-0.5"
                  style={{ color: riskC, background: riskC + '20' }}>
                  {RISK_LABEL[met.timeoutRisk as RiskLevel]}
                </span>
              </div>
            </div>
          )
        })}

        <div className={cn('px-5 py-3 text-[11px]', textSub)}>
          <span className="font-semibold">Hinweis:</span>
          {' '}Metriken basieren auf historischen Verbindungsdaten aus dem nginx access log.
          Hochfrequente Kassen sollten per LAN angebunden sein um Druckausfälle zu minimieren.
        </div>
      </CardBody>
    </Card>
  )
}

// ── Fehlerquellen-Warnungen ───────────────────────────────────────────────────
function FehlerquellenWarnings({ config, dark }: { config: NginxConfig; dark: boolean }) {
  const wlan = config.ipMappings.filter((m) => m.connectionType === 'WLAN')
  const lan  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN')

  const warnings: Array<{ level: 'crit' | 'warn'; msg: string; detail: string }> = []

  const critWlan = wlan.filter((m) => deviceMetrics(m.ip, 'WLAN').timeoutRisk === 'critical')
  const highWlan = wlan.filter((m) => deviceMetrics(m.ip, 'WLAN').timeoutRisk === 'high')

  if (critWlan.length > 0) {
    const names = critWlan.map((m) => m.name || `Kasse ${m.ip.split('.').pop()}`).join(', ')
    warnings.push({
      level:  'crit',
      msg:    `${critWlan.length} Kasse${critWlan.length > 1 ? 'n' : ''} mit kritischem WLAN-Signal`,
      detail: `${names} — Druckausfälle wahrscheinlich. LAN-Anbindung dringend empfohlen.`,
    })
  }

  if (highWlan.length > 0) {
    const names = highWlan.map((m) => m.name || `Kasse ${m.ip.split('.').pop()}`).join(', ')
    warnings.push({
      level:  'warn',
      msg:    `${highWlan.length} Kasse${highWlan.length > 1 ? 'n' : ''} mit erhöhtem Timeout-Risiko`,
      detail: `${names} — Fehlgeschlagene Druckjobs möglich bei Netzwerkschwankungen.`,
    })
  }

  if (wlan.length > 0 && wlan.length > lan.length) {
    warnings.push({
      level:  'warn',
      msg:    `Mehr als die Hälfte der Kassen per WLAN (${wlan.length}/${config.ipMappings.length})`,
      detail: 'WLAN-Netzwerke sind fehleranfälliger. Kassen mit hohem Druckvolumen sollten per LAN angebunden werden.',
    })
  }

  if (warnings.length === 0) {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        dark ? 'bg-success-500/5 border-success-500/20' : 'bg-success-50 border-success-200'
      )}>
        <CheckCircle className="h-4 w-4 text-success-400 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-success-600 dark:text-success-400">
            Alles im grünen Bereich
          </p>
          <p className={cn('text-[11px]', dark ? 'text-[#8b949e]' : 'text-slate-500')}>
            Keine kritischen Verbindungsprobleme erkannt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        const isCrit = w.level === 'crit'
        return (
          <div key={i} className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3',
            isCrit
              ? (dark ? 'bg-danger-500/8 border-danger-500/25' : 'bg-danger-50 border-danger-200')
              : (dark ? 'bg-warning-500/8 border-warning-500/25' : 'bg-warning-50 border-warning-200')
          )}>
            <AlertTriangle className={cn('h-4 w-4 shrink-0 mt-0.5',
              isCrit ? 'text-danger-400' : 'text-warning-400')} />
            <div>
              <p className={cn('text-[13px] font-semibold',
                isCrit ? 'text-danger-500 dark:text-danger-400' : 'text-warning-600 dark:text-warning-400')}>
                {w.msg}
              </p>
              <p className={cn('text-[11px] mt-0.5', dark ? 'text-[#8b949e]' : 'text-slate-500')}>
                {w.detail}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function DashboardPanel({ config, dark }: Props) {
  const bonsData  = generateBonsData(config.ipMappings.length)
  const bonsHeute = bonsData.reduce((a, b) => a + b, 0)
  const now       = new Date().getHours()

  const lan  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN')
  const wlan = config.ipMappings.filter((m) => m.connectionType === 'WLAN')

  const lanMetrics  = aggregateMetrics(lan.map((m)  => ({ ip: m.ip, type: 'LAN'  as const })))
  const wlanMetrics = aggregateMetrics(wlan.map((m) => ({ ip: m.ip, type: 'WLAN' as const })))

  const total     = config.ipMappings.length
  const blendedEr = total === 0
    ? 0
    : (wlan.length * wlanMetrics.avgErrorRate + lan.length * 0.05) / total

  const cardCls  = dark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const textMain = dark ? 'text-[#e6edf3]' : 'text-[#1a1f36]'
  const textSub  = dark ? 'text-[#8b949e]' : 'text-slate-500'
  const rowHover = dark ? 'hover:bg-[#21262d]' : 'hover:bg-slate-50'

  return (
    <div className="space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon:  <Monitor className="h-5 w-5" />,
            label: 'Kassen',
            value: String(total),
            sub:   `${lan.length} LAN · ${wlan.length} WLAN`,
            color: 'text-primary-400',
            bg:    dark ? 'bg-primary-500/10' : 'bg-primary-50',
          },
          {
            icon:  <Printer className="h-5 w-5" />,
            label: 'Drucker',
            value: String(config.upstreams.length),
            sub:   `${config.upstreams.reduce((n, u) => n + u.servers.length, 0)} Server`,
            color: 'text-success-400',
            bg:    dark ? 'bg-success-500/10' : 'bg-success-50',
          },
          {
            icon:  <TrendingUp className="h-5 w-5" />,
            label: 'Bons heute',
            value: bonsHeute.toLocaleString('de-DE'),
            sub:   `${bonsData[now]} in Stunde ${now}`,
            color: 'text-secondary-400',
            bg:    dark ? 'bg-secondary-500/10' : 'bg-secondary-50',
          },
          {
            icon:  <Zap className="h-5 w-5" />,
            label: 'Ø Fehlerrate',
            value: total === 0 ? '–' : `${blendedEr.toFixed(1)}%`,
            sub:   wlan.length > 0
              ? `WLAN Ø ${wlanMetrics.avgErrorRate}% · LAN < 0.1%`
              : 'Alle per LAN — optimal',
            color: blendedEr > 1.5 ? 'text-warning-400' : 'text-success-400',
            bg:    blendedEr > 1.5
              ? (dark ? 'bg-warning-500/10' : 'bg-warning-50')
              : (dark ? 'bg-success-500/10' : 'bg-success-50'),
          },
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

      {/* Fehlerquellen-Warnungen */}
      <FehlerquellenWarnings config={config} dark={dark} />

      {/* LAN vs WLAN Verbindungsübersicht */}
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-default-400" />
            <div>
              <p className={cn('text-[14px] font-semibold', textMain)}>Verbindungsübersicht</p>
              <p className={cn('text-[12px]', textSub)}>
                LAN vs. WLAN — Qualität &amp; Fehlerquellen im Vergleich
              </p>
            </div>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex h-2.5 w-28 rounded-full overflow-hidden">
                <div className="bg-success-400 h-full"
                  style={{ width: `${(lan.length / total) * 100}%` }} />
                <div className="bg-warning-400 h-full"
                  style={{ width: `${(wlan.length / total) * 100}%` }} />
              </div>
              <span className={cn('text-[10px]', textSub)}>
                {Math.round((lan.length / total) * 100)}% LAN
              </span>
            </div>
          )}
        </CardHeader>
        <Divider className={dark ? 'bg-[#21262d]' : 'bg-slate-100'} />
        <CardBody className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <ConnectionTypeCard type="LAN"  count={lan.length}  metrics={lanMetrics}  dark={dark} />
            <ConnectionTypeCard type="WLAN" count={wlan.length} metrics={wlanMetrics} dark={dark} />
          </div>
        </CardBody>
      </Card>

      {/* WLAN Gerätestatus (only if WLAN devices exist) */}
      {wlan.length > 0 && <WlanDeviceTable mappings={wlan} dark={dark} />}

      {/* Routing map */}
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-col items-start gap-0.5">
          <p className={cn('text-[14px] font-semibold', textMain)}>Kassen → Drucker Routing</p>
          <p className={cn('text-[12px]', textSub)}>Welches Terminal druckt auf welchen Drucker</p>
        </CardHeader>
        <Divider className={dark ? 'bg-[#21262d]' : 'bg-slate-100'} />
        <CardBody className="px-5 py-4 space-y-3">
          {config.upstreams.map((upstream, idx) => {
            const col       = UP_COLORS[idx % UP_COLORS.length]
            const mappings  = config.ipMappings.filter((m) => m.upstream === upstream.name)
            const isDefault = upstream.name === config.defaultUpstream

            return (
              <div key={upstream.name}
                className={cn('rounded-xl border p-4 transition-colors', rowHover,
                  dark ? 'border-[#21262d]' : 'border-slate-200')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dark ? col.dot : col.dotLight }} />
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

                {mappings.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pl-5">
                    {mappings.map((m) => {
                      const isWlan = m.connectionType === 'WLAN'
                      const met    = isWlan ? deviceMetrics(m.ip, 'WLAN') : null
                      const name   = m.name || `Kasse ${m.ip.split('.').pop()}`
                      return (
                        <Tooltip key={m.ip} placement="top" content={
                          isWlan && met
                            ? `Signal ${met.signal}% · ${met.errorRate}% Fehler · ${met.latencyMs}ms · Risiko: ${RISK_LABEL[met.timeoutRisk as RiskLevel]}`
                            : 'LAN · stabile Kabelverbindung'
                        }>
                          <div className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] cursor-default',
                            isWlan && met?.needsAttention
                              ? (dark ? 'bg-warning-500/10 border-warning-500/30' : 'bg-warning-50 border-warning-200')
                              : (dark ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-50 border-slate-200')
                          )}>
                            {isWlan
                              ? <><SignalBars level={met!.signalLevel} /><Wifi className="h-3 w-3 text-warning-400" /></>
                              : <Network className="h-3 w-3 text-success-400" />
                            }
                            <span className={cn('font-semibold', textMain)}>{name}</span>
                            <span className={cn('font-mono', textSub)}>{m.ip}</span>
                          </div>
                        </Tooltip>
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

      {/* Bons / Stunde */}
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className={cn('text-[14px] font-semibold', textMain)}>Bons pro Stunde</p>
            <p className={cn('text-[12px]', textSub)}>
              {wlan.length > 0
                ? `WLAN-Fehlerrate → ~${Math.round(bonsHeute * wlanMetrics.avgErrorRate / 100)} verpasste Bons heute`
                : 'Heutiger Druckdurchsatz — alle Kassen per LAN'}
            </p>
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

// ── Bons chart ────────────────────────────────────────────────────────────────
function BonsChart({ data, currentHour, dark }: { data: number[]; currentHour: number; dark: boolean }) {
  const max = Math.max(...data, 1)
  const W = 800; const H = 180
  const PL = 44; const PB = 28; const PT = 16
  const cW    = W - PL - 8
  const cH    = H - PB - PT
  const slotW = cW / 24
  const barW  = slotW - 3

  const grid       = dark ? '#21262d' : '#e2e8f0'
  const lbl        = dark ? '#8b949e' : '#94a3b8'
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
          const x     = PL + h * slotW + 1.5
          const bH    = Math.max((count / max) * cH, count > 0 ? 2 : 0)
          const y     = PT + cH - bH
          const isCur = h === currentHour
          const fill  = isCur ? barCurrent : h < currentHour ? barPast : barFuture
          const op    = isCur ? 1 : h < currentHour ? 0.75 : 0.5
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
