import { useState } from 'react'
import { Plus, Trash2, Wifi, Network, Edit2, Check, X, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { NginxConfig, IpMapping } from '@/types/nginx'

interface KassenPanelProps {
  config: NginxConfig
  onChange: (config: NginxConfig) => void
}

function validateIp(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every((p) => parseInt(p) <= 255)
}

function ConnectionToggle({
  value,
  onChange,
}: {
  value: 'LAN' | 'WLAN'
  onChange: (v: 'LAN' | 'WLAN') => void
}) {
  return (
    <div className="flex rounded-md border border-[hsl(var(--border))] overflow-hidden">
      <button
        onClick={() => onChange('LAN')}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          value === 'LAN'
            ? 'bg-[hsl(160,60%,45%)]/15 text-[hsl(160,60%,55%)]'
            : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
        }`}
      >
        <Network className="h-3 w-3" />
        LAN
      </button>
      <div className="w-px bg-[hsl(var(--border))]" />
      <button
        onClick={() => onChange('WLAN')}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          value === 'WLAN'
            ? 'bg-[hsl(38,90%,55%)]/15 text-[hsl(38,90%,60%)]'
            : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
        }`}
      >
        <Wifi className="h-3 w-3" />
        WLAN
      </button>
    </div>
  )
}

function KassenRow({
  mapping,
  upstreams,
  onChange,
  onDelete,
}: {
  mapping: IpMapping
  upstreams: NginxConfig['upstreams']
  onChange: (updated: IpMapping) => void
  onDelete: () => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(mapping.name ?? '')

  const commitName = () => {
    onChange({ ...mapping, name: nameVal.trim() || undefined })
    setEditingName(false)
  }

  const isWlan = mapping.connectionType === 'WLAN'
  const displayName = mapping.name || `Kasse ${mapping.ip.split('.').pop()}`

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 transition-colors hover:border-[hsl(var(--ring))]/30">
      {/* Connection type toggle */}
      <ConnectionToggle
        value={mapping.connectionType ?? 'LAN'}
        onChange={(v) => onChange({ ...mapping, connectionType: v })}
      />

      {/* Name + IP */}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <div className="flex items-center gap-1">
            <Input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="h-7 text-sm w-36"
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={commitName}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingName(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 group/name text-left"
            onClick={() => { setNameVal(mapping.name ?? ''); setEditingName(true) }}
          >
            <span className="text-sm font-semibold">{displayName}</span>
            <Edit2 className="h-3 w-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover/name:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">{mapping.ip}</p>
      </div>

      {/* Verbindungstyp-Pill */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: isWlan ? 'hsl(38,90%,55%)' : 'hsl(160,60%,50%)' }}
        />
        <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">
          {isWlan ? 'Wireless' : 'Kabel'}
        </span>
      </div>

      {/* Drucker-Zuweisung */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-[hsl(var(--muted-foreground))] hidden md:block">→</span>
        <Select
          value={mapping.upstream}
          onChange={(e) => onChange({ ...mapping, upstream: e.target.value })}
          className="h-8 text-xs w-36"
        >
          {upstreams.map((u) => (
            <option key={u.name} value={u.name}>{u.name}</option>
          ))}
        </Select>
      </div>

      {/* Löschen */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function KassenPanel({ config, onChange }: KassenPanelProps) {
  const [newName,     setNewName]     = useState('')
  const [newIp,       setNewIp]       = useState('')
  const [newType,     setNewType]     = useState<'LAN' | 'WLAN'>('LAN')
  const [newUpstream, setNewUpstream] = useState(config.upstreams[0]?.name ?? '')
  const [ipError,     setIpError]     = useState('')

  const updateMapping = (ip: string, updated: IpMapping) => {
    onChange({
      ...config,
      ipMappings: config.ipMappings.map((m) => (m.ip === ip ? updated : m)),
    })
  }

  const deleteMapping = (ip: string) => {
    onChange({
      ...config,
      ipMappings: config.ipMappings.filter((m) => m.ip !== ip),
    })
  }

  const addKasse = () => {
    const ip = newIp.trim()
    if (!validateIp(ip)) { setIpError('Ungültige IP-Adresse'); return }
    if (config.ipMappings.find((m) => m.ip === ip)) { setIpError('IP bereits vergeben'); return }
    setIpError('')
    onChange({
      ...config,
      ipMappings: [
        ...config.ipMappings,
        {
          ip,
          upstream: newUpstream || config.upstreams[0]?.name,
          name: newName.trim() || undefined,
          connectionType: newType,
        },
      ],
    })
    setNewName('')
    setNewIp('')
    setNewType('LAN')
  }

  const lanMappings  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN')
  const wlanMappings = config.ipMappings.filter((m) => m.connectionType === 'WLAN')

  const SectionHeader = ({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) => (
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</span>
      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Kassen list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Kassen verwalten
          </CardTitle>
          <CardDescription className="text-xs">
            Name, Verbindungstyp (LAN/WLAN) und Drucker-Zuweisung pro Terminal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {config.ipMappings.length === 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
              Noch keine Kassen konfiguriert.
            </p>
          )}

          {lanMappings.length > 0 && (
            <div>
              <SectionHeader
                icon={<Network className="h-3.5 w-3.5 text-[hsl(160,60%,50%)]" />}
                label="Kabel (LAN)"
                count={lanMappings.length}
              />
              <div className="space-y-2">
                {lanMappings.map((m) => (
                  <KassenRow
                    key={m.ip}
                    mapping={m}
                    upstreams={config.upstreams}
                    onChange={(updated) => updateMapping(m.ip, updated)}
                    onDelete={() => deleteMapping(m.ip)}
                  />
                ))}
              </div>
            </div>
          )}

          {wlanMappings.length > 0 && (
            <div>
              <SectionHeader
                icon={<Wifi className="h-3.5 w-3.5 text-[hsl(38,90%,55%)]" />}
                label="Wireless (WLAN)"
                count={wlanMappings.length}
              />
              <div className="space-y-2">
                {wlanMappings.map((m) => (
                  <KassenRow
                    key={m.ip}
                    mapping={m}
                    upstreams={config.upstreams}
                    onChange={(updated) => updateMapping(m.ip, updated)}
                    onDelete={() => deleteMapping(m.ip)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Neue Kasse hinzufügen */}
      <Card className="border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Neue Kasse hinzufügen</CardTitle>
          <CardDescription className="text-xs">
            Name, IP-Adresse, Verbindungstyp und Drucker angeben
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name (optional)</Label>
              <Input
                placeholder="Kasse Theke"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">IP-Adresse</Label>
              <Input
                placeholder="10.1.0.35"
                value={newIp}
                onChange={(e) => { setNewIp(e.target.value); setIpError('') }}
                onKeyDown={(e) => e.key === 'Enter' && addKasse()}
                className={`font-mono text-sm ${ipError ? 'border-[hsl(var(--destructive))]' : ''}`}
              />
              {ipError && <p className="text-xs text-[hsl(var(--destructive))]">{ipError}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Verbindungstyp</Label>
              <ConnectionToggle value={newType} onChange={setNewType} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Drucker</Label>
              <Select
                value={newUpstream}
                onChange={(e) => setNewUpstream(e.target.value)}
              >
                {config.upstreams.map((u) => (
                  <option key={u.name} value={u.name}>{u.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addKasse}
            disabled={!newIp.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Kasse hinzufügen
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
