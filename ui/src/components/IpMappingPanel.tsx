import { useState } from 'react'
import { Plus, Trash2, ArrowRight, Network } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { NginxConfig, IpMapping } from '@/types/nginx'

interface IpMappingPanelProps {
  config: NginxConfig
  onChange: (config: NginxConfig) => void
}

function validateIp(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every((p) => parseInt(p) <= 255)
}

export function IpMappingPanel({ config, onChange }: IpMappingPanelProps) {
  const [newIp, setNewIp] = useState('')
  const [newUpstream, setNewUpstream] = useState(config.upstreams[0]?.name ?? '')
  const [ipError, setIpError] = useState('')

  const addMapping = () => {
    const ip = newIp.trim()
    if (!validateIp(ip)) {
      setIpError('Invalid IP address')
      return
    }
    if (config.ipMappings.find((m) => m.ip === ip)) {
      setIpError('IP already mapped')
      return
    }
    setIpError('')
    onChange({
      ...config,
      ipMappings: [...config.ipMappings, { ip, upstream: newUpstream || config.upstreams[0]?.name }],
    })
    setNewIp('')
  }

  const removeMapping = (ip: string) => {
    onChange({
      ...config,
      ipMappings: config.ipMappings.filter((m) => m.ip !== ip),
    })
  }

  const updateUpstream = (ip: string, upstream: string) => {
    onChange({
      ...config,
      ipMappings: config.ipMappings.map((m) =>
        m.ip === ip ? { ...m, upstream } : m
      ),
    })
  }

  const updateDefaultUpstream = (upstream: string) => {
    onChange({ ...config, defaultUpstream: upstream })
  }

  // Group mappings by upstream
  const grouped = config.upstreams.reduce<Record<string, IpMapping[]>>((acc, u) => {
    acc[u.name] = config.ipMappings.filter((m) => m.upstream === u.name)
    return acc
  }, {})

  const upstreamColors: Record<string, string> = {}
  const palette = [
    'hsl(210,80%,55%)',
    'hsl(142,60%,45%)',
    'hsl(38,90%,55%)',
    'hsl(280,60%,60%)',
    'hsl(0,65%,55%)',
  ]
  config.upstreams.forEach((u, i) => {
    upstreamColors[u.name] = palette[i % palette.length]
  })

  return (
    <div className="space-y-6">
      {/* Default routing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Default Route
          </CardTitle>
          <CardDescription className="text-xs">
            Fallback upstream for IPs not listed in the map block
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="text-sm font-mono text-[hsl(var(--muted-foreground))]">
              $remote_addr → default →
            </code>
            <Select
              value={config.defaultUpstream}
              onChange={(e) => updateDefaultUpstream(e.target.value)}
              className="w-48"
            >
              {config.upstreams.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped mappings */}
      <div className="grid gap-4 md:grid-cols-2">
        {config.upstreams.map((upstream) => {
          const mappings = grouped[upstream.name] ?? []
          const color = upstreamColors[upstream.name]
          return (
            <Card key={upstream.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <CardTitle className="text-sm font-mono">{upstream.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {mappings.length} IP{mappings.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-mono">
                  → {upstream.servers.map((s) => s.address).join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {mappings.length === 0 && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] py-2 text-center">
                    No IPs mapped to this upstream
                  </p>
                )}
                {mappings.map((mapping) => (
                  <div
                    key={mapping.ip}
                    className="group flex items-center justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{mapping.ip}</code>
                      <ArrowRight className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                      <Select
                        value={mapping.upstream}
                        onChange={(e) => updateUpstream(mapping.ip, e.target.value)}
                        className="h-6 text-xs py-0 w-36"
                      >
                        {config.upstreams.map((u) => (
                          <option key={u.name} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                      onClick={() => removeMapping(mapping.ip)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add mapping */}
      <Card className="border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add IP Mapping</CardTitle>
          <CardDescription className="text-xs">
            Route a specific client IP to a printer upstream
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Client IP Address</Label>
              <Input
                placeholder="10.1.0.35"
                value={newIp}
                onChange={(e) => { setNewIp(e.target.value); setIpError('') }}
                onKeyDown={(e) => e.key === 'Enter' && addMapping()}
                className={`font-mono text-sm ${ipError ? 'border-[hsl(var(--destructive))]' : ''}`}
              />
              {ipError && <p className="text-xs text-[hsl(var(--destructive))]">{ipError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Upstream</Label>
              <Select
                value={newUpstream}
                onChange={(e) => setNewUpstream(e.target.value)}
              >
                {config.upstreams.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addMapping}
            disabled={!newIp.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Add IP Mapping
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
