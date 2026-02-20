import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Settings, FileText } from 'lucide-react'
import type { NginxConfig } from '@/types/nginx'

interface GeneralPanelProps {
  config: NginxConfig
  onChange: (config: NginxConfig) => void
}

export function GeneralPanel({ config, onChange }: GeneralPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            TCP Server
          </CardTitle>
          <CardDescription className="text-xs">
            Core nginx stream server settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Listen Port</Label>
              <Input
                type="number"
                min={1}
                max={65535}
                value={config.listenPort}
                onChange={(e) =>
                  onChange({ ...config, listenPort: parseInt(e.target.value, 10) || 9100 })
                }
                className="font-mono"
              />
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Default: 9100 (RAW printing protocol)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Default Upstream</Label>
              <Select
                value={config.defaultUpstream}
                onChange={(e) => onChange({ ...config, defaultUpstream: e.target.value })}
              >
                {config.upstreams.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </Select>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Fallback for unmapped client IPs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Logging
          </CardTitle>
          <CardDescription className="text-xs">
            Access log configuration for the TCP stream
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Log Path</Label>
            <Input
              value={config.logPath}
              onChange={(e) => onChange({ ...config, logPath: e.target.value })}
              className="font-mono text-sm"
              placeholder="/var/log/nginx/tcp_router.log"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-xs">Log Format Name</Label>
            <Input
              value={config.logFormat}
              onChange={(e) => onChange({ ...config, logFormat: e.target.value })}
              className="font-mono text-sm"
              placeholder="tcp_router"
            />
          </div>
          <div className="rounded-lg bg-[hsl(var(--muted))] p-3">
            <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wide">
              Log format fields
            </p>
            <div className="space-y-1">
              {[
                ['$time_local', 'Timestamp'],
                ['$remote_addr:$remote_port', 'Client IP + Port'],
                ['$upstream_addr', 'Printer backend'],
                ['$status', 'Connection status'],
                ['$bytes_sent / $bytes_received', 'Transfer size'],
                ['$session_time', 'Connection duration'],
              ].map(([field, desc]) => (
                <div key={field} className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-[hsl(210,80%,65%)] w-48 shrink-0">
                    {field}
                  </code>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
