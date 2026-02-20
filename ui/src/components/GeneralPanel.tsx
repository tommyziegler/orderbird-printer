import { Card, CardBody, CardHeader, Input, Select, SelectItem, Divider } from '@heroui/react'
import { Settings, FileText } from 'lucide-react'
import type { NginxConfig } from '@/types/nginx'

interface Props { config: NginxConfig; onChange: (c: NginxConfig) => void }

const LOG_FIELDS = [
  ['$time_local',              'Timestamp'],
  ['$remote_addr:$remote_port','Client IP + Port'],
  ['$upstream_addr',           'Drucker-Backend'],
  ['$status',                  'Verbindungsstatus'],
  ['$bytes_sent / $bytes_received', 'Transfergröße'],
  ['$session_time',            'Verbindungsdauer'],
]

export function GeneralPanel({ config, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Card className="border border-default-200 bg-content1 shadow-sm" shadow="none">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-default-400" />
            <div>
              <p className="text-[14px] font-semibold text-foreground">TCP Server</p>
              <p className="text-[12px] text-default-400">nginx Stream Grundeinstellungen</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Listen Port"
                type="number"
                min={1} max={65535}
                size="sm"
                value={String(config.listenPort)}
                onValueChange={(v) => onChange({ ...config, listenPort: parseInt(v, 10) || 9100 })}
                description="Standard: 9100 (RAW-Druckprotokoll)"
                classNames={{ input: 'font-mono' }}
              />
            </div>
            <div>
              <Select
                label="Standard-Upstream"
                size="sm"
                selectedKeys={[config.defaultUpstream]}
                onSelectionChange={(keys) => onChange({ ...config, defaultUpstream: [...keys][0] as string })}
                description="Fallback für nicht konfigurierte Kassen"
                aria-label="Standard-Upstream wählen"
              >
                {config.upstreams.map((u) => (
                  <SelectItem key={u.name}>{u.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-default-200 bg-content1 shadow-sm" shadow="none">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-default-400" />
            <div>
              <p className="text-[14px] font-semibold text-foreground">Logging</p>
              <p className="text-[12px] text-default-400">Access Log Konfiguration</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4 space-y-4">
          <Input
            label="Log-Pfad"
            size="sm"
            value={config.logPath}
            onValueChange={(v) => onChange({ ...config, logPath: v })}
            placeholder="/var/log/nginx/tcp_router.log"
            classNames={{ input: 'font-mono' }}
          />
          <Input
            label="Log-Format Name"
            size="sm"
            value={config.logFormat}
            onValueChange={(v) => onChange({ ...config, logFormat: v })}
            placeholder="tcp_router"
            classNames={{ input: 'font-mono' }}
          />
          <div className="rounded-xl border border-default-100 bg-default-50 dark:bg-default-50/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-default-400 mb-3">
              Verfügbare Log-Felder
            </p>
            <div className="space-y-1.5">
              {LOG_FIELDS.map(([field, desc]) => (
                <div key={field} className="flex items-center gap-3">
                  <code className="text-[11px] font-mono text-primary-400 w-52 shrink-0">{field}</code>
                  <span className="text-[11px] text-default-400">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
