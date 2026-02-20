import { Printer, Network, Server, GitBranch } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { NginxConfig } from '@/types/nginx'

interface DashboardPanelProps {
  config: NginxConfig
}

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
        />
        <StatCard
          icon={<Server className="h-5 w-5" />}
          label="Upstreams"
          value={String(upstreams.length)}
          sub="printer groups"
        />
        <StatCard
          icon={<GitBranch className="h-5 w-5" />}
          label="IP Routes"
          value={String(totalIps)}
          sub="mapped clients"
        />
        <StatCard
          icon={<Printer className="h-5 w-5" />}
          label="Printers"
          value={String(upstreams.reduce((n, u) => n + u.servers.length, 0))}
          sub="backend servers"
        />
      </div>

      {/* Routing overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Routing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upstreams.map((upstream) => {
              const ips = config.ipMappings.filter((m) => m.upstream === upstream.name)
              const isDefault = upstream.name === config.defaultUpstream
              return (
                <div key={upstream.name}>
                  <div className="flex items-start gap-4">
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
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {upstream.servers.map((s) => s.address).join(', ')}
                        </Badge>
                      </div>
                      {ips.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {ips.map((m) => (
                            <div
                              key={m.ip}
                              className="flex items-center gap-1 rounded-md bg-[hsl(var(--muted))] px-2 py-1"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-[hsl(142,60%,45%)]" />
                              <code className="text-xs font-mono">{m.ip}</code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
                          No specific IPs — receives{isDefault ? ' all unmatched traffic' : ' no traffic unless reassigned'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Separator className="mt-3" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Traffic flow diagram */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Traffic Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {/* Client */}
            <div className="shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-center min-w-[110px]">
              <Network className="h-5 w-5 mx-auto mb-1.5 text-[hsl(var(--muted-foreground))]" />
              <p className="text-xs font-medium">Client</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">POS Terminal</p>
            </div>

            <Arrow label={`port ${config.listenPort}`} />

            {/* nginx */}
            <div className="shrink-0 rounded-lg border border-[hsl(210,80%,55%)]/40 bg-[hsl(210,80%,55%)]/10 p-3 text-center min-w-[110px]">
              <div className="text-[hsl(210,80%,65%)] text-lg font-bold mb-1">N</div>
              <p className="text-xs font-medium">nginx</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">stream router</p>
            </div>

            <Arrow label="map $remote_addr" />

            {/* Upstreams */}
            <div className="shrink-0 flex flex-col gap-2">
              {upstreams.map((u) => (
                <div
                  key={u.name}
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2 text-center min-w-[130px]"
                >
                  <Printer className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-[11px] font-mono font-medium">{u.name}</p>
                  {u.servers.map((s) => (
                    <p key={s.address} className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
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
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="text-[hsl(var(--muted-foreground))]">{icon}</div>
        </div>
        <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
        <p className="text-xs font-medium text-[hsl(var(--foreground))] mt-0.5">{label}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{sub}</p>
      </CardContent>
    </Card>
  )
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="shrink-0 flex flex-col items-center gap-0.5">
      <p className="text-[9px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">{label}</p>
      <div className="flex items-center">
        <div className="h-px w-10 bg-[hsl(var(--border))]" />
        <div className="border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-[hsl(var(--muted-foreground))] h-0 w-0" />
      </div>
    </div>
  )
}
