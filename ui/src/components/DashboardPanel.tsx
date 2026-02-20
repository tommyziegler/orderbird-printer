import { Printer, Network, Server, GitBranch, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { NginxConfig } from '@/types/nginx'

interface DashboardPanelProps {
  config: NginxConfig
}

const STAT_ACCENTS = [
  { bg: 'bg-[hsl(217,91%,60%)]/10', icon: 'text-[hsl(217,91%,65%)]', border: 'border-[hsl(217,91%,60%)]/20' },
  { bg: 'bg-[hsl(265,80%,65%)]/10', icon: 'text-[hsl(265,80%,70%)]', border: 'border-[hsl(265,80%,65%)]/20' },
  { bg: 'bg-[hsl(160,60%,45%)]/10', icon: 'text-[hsl(160,60%,50%)]', border: 'border-[hsl(160,60%,45%)]/20' },
  { bg: 'bg-[hsl(35,90%,55%)]/10',  icon: 'text-[hsl(35,90%,60%)]',  border: 'border-[hsl(35,90%,55%)]/20'  },
]

export function DashboardPanel({ config }: DashboardPanelProps) {
  const totalIps = config.ipMappings.length
  const upstreams = config.upstreams

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Network className="h-5 w-5" />}
          label="Listen Port"
          value={`:${config.listenPort}`}
          sub="TCP stream"
          accent={STAT_ACCENTS[0]}
        />
        <StatCard
          icon={<Server className="h-5 w-5" />}
          label="Upstreams"
          value={String(upstreams.length)}
          sub="printer groups"
          accent={STAT_ACCENTS[1]}
        />
        <StatCard
          icon={<GitBranch className="h-5 w-5" />}
          label="IP Routes"
          value={String(totalIps)}
          sub="mapped clients"
          accent={STAT_ACCENTS[2]}
        />
        <StatCard
          icon={<Printer className="h-5 w-5" />}
          label="Printers"
          value={String(upstreams.reduce((n, u) => n + u.servers.length, 0))}
          sub="backend servers"
          accent={STAT_ACCENTS[3]}
        />
      </div>

      {/* Routing overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Routing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {upstreams.map((upstream, idx) => {
              const ips = config.ipMappings.filter((m) => m.upstream === upstream.name)
              const isDefault = upstream.name === config.defaultUpstream
              return (
                <div key={upstream.name}>
                  <div className="flex items-start gap-4 py-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `hsl(${[217, 265, 160, 35][idx % 4]}, ${[91, 80, 60, 90][idx % 4]}%, ${[60, 65, 45, 55][idx % 4]}%, 0.15)` }}
                    >
                      <Server
                        className="h-3.5 w-3.5"
                        style={{ color: `hsl(${[217, 265, 160, 35][idx % 4]}, ${[91, 80, 60, 90][idx % 4]}%, ${[65, 70, 50, 60][idx % 4]}%)` }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono font-semibold text-[hsl(var(--foreground))]">
                          {upstream.name}
                        </code>
                        {isDefault && (
                          <Badge variant="warning" className="text-[10px] h-4 px-1.5">
                            default
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                          {upstream.servers.map((s) => s.address).join(', ')}
                        </Badge>
                      </div>
                      {ips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {ips.map((m) => (
                            <div
                              key={m.ip}
                              className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-1"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
                              <code className="text-xs font-mono text-[hsl(var(--foreground))]">{m.ip}</code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                          No specific IPs —{isDefault ? ' receives all unmatched traffic' : ' no traffic unless reassigned'}
                        </p>
                      )}
                    </div>
                  </div>
                  {idx < upstreams.length - 1 && <Separator />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Traffic flow diagram */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Traffic Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {/* Client node */}
            <FlowNode
              icon={<Network className="h-5 w-5" />}
              label="Client"
              sub="POS Terminal"
              color="hsl(215,20%,52%)"
              borderColor="hsl(var(--border))"
              bgColor="hsl(var(--muted))"
            />

            <FlowArrow label={`TCP :${config.listenPort}`} />

            {/* nginx node */}
            <FlowNode
              icon={<div className="text-[hsl(217,91%,65%)] text-base font-black leading-none">N</div>}
              label="nginx"
              sub="stream router"
              color="hsl(217,91%,65%)"
              borderColor="hsl(217,91%,60%,0.35)"
              bgColor="hsl(217,91%,60%,0.08)"
              highlight
            />

            <FlowArrow label="map $remote_addr" />

            {/* Upstream nodes */}
            <div className="shrink-0 flex flex-col gap-2">
              {upstreams.map((u, idx) => (
                <div
                  key={u.name}
                  className="rounded-xl border px-3 py-2.5 text-center min-w-[140px]"
                  style={{
                    borderColor: `hsl(${[217, 265, 160, 35][idx % 4]}, ${[91, 80, 60, 90][idx % 4]}%, ${[60, 65, 45, 55][idx % 4]}%, 0.25)`,
                    background: `hsl(${[217, 265, 160, 35][idx % 4]}, ${[91, 80, 60, 90][idx % 4]}%, ${[60, 65, 45, 55][idx % 4]}%, 0.07)`,
                  }}
                >
                  <Printer
                    className="h-4 w-4 mx-auto mb-1.5"
                    style={{ color: `hsl(${[217, 265, 160, 35][idx % 4]}, ${[91, 80, 60, 90][idx % 4]}%, ${[65, 70, 50, 60][idx % 4]}%)` }}
                  />
                  <p className="text-[11px] font-mono font-semibold text-[hsl(var(--foreground))]">{u.name}</p>
                  {u.servers.map((s) => (
                    <p key={s.address} className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                      {s.address}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: { bg: string; icon: string; border: string }
}) {
  return (
    <Card className={`border ${accent.border} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bg} ${accent.icon}`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-[hsl(var(--foreground))] mt-0.5">{label}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function FlowNode({
  icon,
  label,
  sub,
  color,
  borderColor,
  bgColor,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  color: string
  borderColor: string
  bgColor: string
  highlight?: boolean
}) {
  return (
    <div
      className={`shrink-0 rounded-xl border p-3.5 text-center min-w-[110px] ${highlight ? 'shadow-lg' : ''}`}
      style={{ borderColor, background: bgColor, boxShadow: highlight ? `0 4px 20px ${color}20` : undefined }}
    >
      <div className="flex justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{sub}</p>
    </div>
  )
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="shrink-0 flex flex-col items-center gap-1">
      <p className="text-[9px] text-[hsl(var(--muted-foreground))] whitespace-nowrap font-medium">{label}</p>
      <div className="flex items-center gap-0">
        <div className="h-px w-10 bg-gradient-to-r from-[hsl(var(--border))] to-[hsl(var(--muted-foreground))]/40" />
        <ArrowRight className="h-3 w-3 text-[hsl(var(--muted-foreground))]/60 -ml-1" />
      </div>
    </div>
  )
}
