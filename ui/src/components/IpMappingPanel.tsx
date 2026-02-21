import { useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Chip, Divider, Tooltip } from '@heroui/react'
import { Plus, Trash2, Wifi, Network, Edit2, Check, X, Monitor, AlertTriangle } from 'lucide-react'
import type { NginxConfig, IpMapping } from '@/types/nginx'
import { deviceMetrics, SIGNAL_COLOR, SIGNAL_LABEL, RISK_LABEL, type SignalLevel, type RiskLevel } from '@/lib/networkMetrics'
import { cn } from '@/lib/utils'

function SignalMini({ level, pct }: { level: SignalLevel; pct: number }) {
  const color = SIGNAL_COLOR[level]
  const bars  = level === 'excellent' ? 4 : level === 'good' ? 3 : level === 'fair' ? 2 : 1
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-[2px]">
        {[1,2,3,4].map((b) => (
          <div key={b} className="w-[2.5px] rounded-sm"
            style={{ height: `${5 + b * 2.5}px`, background: b <= bars ? color : '#334155' }} />
        ))}
      </div>
      <span className="text-[10px] font-mono font-semibold" style={{ color }}>{pct}%</span>
    </div>
  )
}

interface Props { config: NginxConfig; onChange: (c: NginxConfig) => void; dark: boolean }

function validateIp(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every((p) => parseInt(p) <= 255)
}

function TypeToggle({ value, onChange }: { value: 'LAN' | 'WLAN'; onChange: (v: 'LAN' | 'WLAN') => void }) {
  return (
    <div className="flex rounded-lg border border-default-200 overflow-hidden">
      {(['LAN', 'WLAN'] as const).map((t) => {
        const active = value === t
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors',
              active
                ? t === 'LAN'
                  ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                  : 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
                : 'text-default-400 hover:bg-default-100'
            )}
          >
            {t === 'LAN' ? <Network className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            {t}
          </button>
        )
      })}
    </div>
  )
}

function KassenRow({ mapping, upstreams, onChange, onDelete }: {
  mapping: IpMapping
  upstreams: NginxConfig['upstreams']
  onChange: (u: IpMapping) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(mapping.name ?? '')

  const commit = () => {
    onChange({ ...mapping, name: nameVal.trim() || undefined })
    setEditing(false)
  }

  const isWlan   = mapping.connectionType === 'WLAN'
  const dispName = mapping.name || `Kasse ${mapping.ip.split('.').pop()}`
  const met      = isWlan ? deviceMetrics(mapping.ip, 'WLAN') : null

  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
      isWlan && met?.needsAttention
        ? 'border-warning-300 dark:border-warning-500/30 bg-warning-50/40 dark:bg-warning-500/5 hover:border-warning-400'
        : 'border-default-200 bg-default-50/50 dark:bg-default-50/5 hover:border-primary-200'
    )}>
      <TypeToggle value={mapping.connectionType ?? 'LAN'} onChange={(v) => onChange({ ...mapping, connectionType: v })} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              size="sm" value={nameVal} onValueChange={setNameVal}
              classNames={{ input: 'text-xs', inputWrapper: 'h-7' }}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
            />
            <Button isIconOnly size="sm" variant="light" color="success" onPress={commit}><Check className="h-3 w-3" /></Button>
            <Button isIconOnly size="sm" variant="light" onPress={() => setEditing(false)}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <button className="flex items-center gap-1.5 group/n text-left" onClick={() => { setNameVal(mapping.name ?? ''); setEditing(true) }}>
            {isWlan && met?.needsAttention && (
              <Tooltip content={`Signal schwach (${met.signal}%) — LAN empfohlen`} placement="top">
                <AlertTriangle className="h-3 w-3 text-warning-400 shrink-0" />
              </Tooltip>
            )}
            <span className="text-[13px] font-semibold text-foreground">{dispName}</span>
            <Edit2 className="h-3 w-3 text-default-300 opacity-0 group-hover/n:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-[11px] text-default-400 font-mono mt-0.5">{mapping.ip}</p>
      </div>

      {/* Signal quality for WLAN */}
      {isWlan && met ? (
        <Tooltip
          placement="top"
          content={`${SIGNAL_LABEL[met.signalLevel]} · ${met.errorRate}% Fehler · ${met.latencyMs}ms · Risiko: ${RISK_LABEL[met.timeoutRisk as RiskLevel]}`}
        >
          <div className="cursor-default">
            <SignalMini level={met.signalLevel} pct={met.signal} />
          </div>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-success-400 font-semibold">
          <Network className="h-3 w-3" />
          <span>stabil</span>
        </div>
      )}

      <Chip size="sm" color={isWlan ? 'warning' : 'success'} variant="flat"
        startContent={isWlan ? <Wifi className="h-2.5 w-2.5" /> : <Network className="h-2.5 w-2.5" />}
        classNames={{ base: 'h-5', content: 'text-[10px] font-semibold hidden sm:block' }}>
        {isWlan ? 'Wireless' : 'Kabel'}
      </Chip>

      <Select size="sm" selectedKeys={[mapping.upstream]}
        onSelectionChange={(keys) => onChange({ ...mapping, upstream: [...keys][0] as string })}
        classNames={{ base: 'w-36', trigger: 'h-8 min-h-8 text-xs' }} aria-label="Drucker">
        {upstreams.map((u) => <SelectItem key={u.name}>{u.name}</SelectItem>)}
      </Select>

      <Button isIconOnly size="sm" variant="light" color="danger"
        className="opacity-0 group-hover:opacity-100 transition-opacity" onPress={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function KassenPanel({ config, onChange, dark }: Props) {
  const [newName,     setNewName]     = useState('')
  const [newIp,       setNewIp]       = useState('')
  const [newType,     setNewType]     = useState<'LAN' | 'WLAN'>('LAN')
  const [newUpstream, setNewUpstream] = useState(config.upstreams[0]?.name ?? '')
  const [ipError,     setIpError]     = useState('')

  const cardCls = dark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'

  const updateM = (ip: string, upd: IpMapping) =>
    onChange({ ...config, ipMappings: config.ipMappings.map((m) => m.ip === ip ? upd : m) })
  const deleteM = (ip: string) =>
    onChange({ ...config, ipMappings: config.ipMappings.filter((m) => m.ip !== ip) })

  const addKasse = () => {
    const ip = newIp.trim()
    if (!validateIp(ip))                            { setIpError('Ungültige IP-Adresse'); return }
    if (config.ipMappings.find((m) => m.ip === ip)) { setIpError('IP bereits vergeben');  return }
    setIpError('')
    onChange({
      ...config,
      ipMappings: [...config.ipMappings, {
        ip, upstream: newUpstream || config.upstreams[0]?.name,
        name: newName.trim() || undefined, connectionType: newType,
      }],
    })
    setNewName(''); setNewIp(''); setNewType('LAN')
  }

  const lan  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN')
  const wlan = config.ipMappings.filter((m) => m.connectionType === 'WLAN')

  return (
    <div className="space-y-4">
      <Card className={cn('border shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-default-400" />
            <p className="text-[14px] font-semibold text-foreground">Kassen verwalten</p>
          </div>
          <p className="text-[12px] text-default-400">Name, Verbindungstyp (LAN/WLAN) und Drucker-Zuweisung</p>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4 space-y-5">
          {config.ipMappings.length === 0 && (
            <p className="text-sm text-default-400 text-center py-4">Noch keine Kassen konfiguriert.</p>
          )}
          {lan.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-3.5 w-3.5 text-success-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-default-400">Kabel (LAN)</span>
                <Chip size="sm" variant="flat" classNames={{ base: 'h-4', content: 'text-[10px]' }}>{lan.length}</Chip>
              </div>
              <div className="space-y-2">
                {lan.map((m) => <KassenRow key={m.ip} mapping={m} upstreams={config.upstreams} onChange={(u) => updateM(m.ip, u)} onDelete={() => deleteM(m.ip)} />)}
              </div>
            </div>
          )}
          {wlan.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-3.5 w-3.5 text-warning-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-default-400">Wireless (WLAN)</span>
                <Chip size="sm" variant="flat" classNames={{ base: 'h-4', content: 'text-[10px]' }}>{wlan.length}</Chip>
              </div>
              <div className="space-y-2">
                {wlan.map((m) => <KassenRow key={m.ip} mapping={m} upstreams={config.upstreams} onChange={(u) => updateM(m.ip, u)} onDelete={() => deleteM(m.ip)} />)}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className={cn('border border-dashed shadow-sm', cardCls)} shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-col items-start gap-0.5">
          <p className="text-[14px] font-semibold text-foreground">Neue Kasse hinzufügen</p>
          <p className="text-[12px] text-default-400">Name, IP, Verbindungstyp und Drucker angeben</p>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name (optional)" placeholder="Kasse Theke" size="sm" value={newName} onValueChange={setNewName} />
            <Input
              label="IP-Adresse" placeholder="10.1.0.35" size="sm"
              value={newIp} onValueChange={(v) => { setNewIp(v); setIpError('') }}
              onKeyDown={(e) => e.key === 'Enter' && addKasse()}
              isInvalid={!!ipError} errorMessage={ipError}
              classNames={{ input: 'font-mono' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <p className="text-[12px] text-default-500 font-medium">Verbindungstyp</p>
              <TypeToggle value={newType} onChange={setNewType} />
            </div>
            <Select label="Drucker" size="sm"
              selectedKeys={[newUpstream]}
              onSelectionChange={(keys) => setNewUpstream([...keys][0] as string)}
              aria-label="Drucker wählen">
              {config.upstreams.map((u) => <SelectItem key={u.name}>{u.name}</SelectItem>)}
            </Select>
          </div>
          <Button color="primary" variant="flat" size="sm" fullWidth
            startContent={<Plus className="h-4 w-4" />}
            onPress={addKasse} isDisabled={!newIp.trim()}>
            Kasse hinzufügen
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
