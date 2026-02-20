import { useState } from 'react'
import { Plus, Trash2, Server, Edit2, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { NginxConfig, Upstream } from '@/types/nginx'

interface UpstreamsPanelProps {
  config: NginxConfig
  onChange: (config: NginxConfig) => void
}

function EditableUpstreamName({
  name,
  onRename,
}: {
  name: string
  onRename: (newName: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  const commit = () => {
    if (value.trim() && value.trim() !== name) onRename(value.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 text-sm w-36"
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={commit}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono font-semibold text-sm">{name}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function UpstreamsPanel({ config, onChange }: UpstreamsPanelProps) {
  const [newUpstreamName, setNewUpstreamName] = useState('')
  const [newUpstreamAddr, setNewUpstreamAddr] = useState('')
  const [newServerInputs, setNewServerInputs] = useState<Record<string, string>>({})

  const addUpstream = () => {
    const name = newUpstreamName.trim()
    const addr = newUpstreamAddr.trim()
    if (!name || !addr) return
    if (config.upstreams.find((u) => u.name === name)) return
    onChange({
      ...config,
      upstreams: [...config.upstreams, { name, servers: [{ address: addr }] }],
    })
    setNewUpstreamName('')
    setNewUpstreamAddr('')
  }

  const removeUpstream = (name: string) => {
    onChange({
      ...config,
      upstreams: config.upstreams.filter((u) => u.name !== name),
      ipMappings: config.ipMappings.map((m) =>
        m.upstream === name ? { ...m, upstream: config.defaultUpstream } : m
      ),
    })
  }

  const renameUpstream = (oldName: string, newName: string) => {
    onChange({
      ...config,
      upstreams: config.upstreams.map((u) =>
        u.name === oldName ? { ...u, name: newName } : u
      ),
      ipMappings: config.ipMappings.map((m) =>
        m.upstream === oldName ? { ...m, upstream: newName } : m
      ),
      defaultUpstream: config.defaultUpstream === oldName ? newName : config.defaultUpstream,
    })
  }

  const addServer = (upstreamName: string) => {
    const addr = (newServerInputs[upstreamName] ?? '').trim()
    if (!addr) return
    onChange({
      ...config,
      upstreams: config.upstreams.map((u) =>
        u.name === upstreamName
          ? { ...u, servers: [...u.servers, { address: addr }] }
          : u
      ),
    })
    setNewServerInputs((prev) => ({ ...prev, [upstreamName]: '' }))
  }

  const removeServer = (upstreamName: string, serverAddr: string) => {
    onChange({
      ...config,
      upstreams: config.upstreams.map((u) =>
        u.name === upstreamName
          ? { ...u, servers: u.servers.filter((s) => s.address !== serverAddr) }
          : u
      ),
    })
  }

  const upstreamUsage = (name: string) =>
    config.ipMappings.filter((m) => m.upstream === name).length

  return (
    <div className="space-y-4">
      {/* Upstream Cards */}
      {config.upstreams.map((upstream: Upstream) => (
        <Card key={upstream.name} className="group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--accent))]">
                  <Server className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </div>
                <div>
                  <EditableUpstreamName
                    name={upstream.name}
                    onRename={(n) => renameUpstream(upstream.name, n)}
                  />
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {upstream.servers.length} server{upstream.servers.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant={upstreamUsage(upstream.name) > 0 ? 'success' : 'secondary'} className="text-[10px] h-4 px-1.5">
                      {upstreamUsage(upstream.name)} IPs routed
                    </Badge>
                    {config.defaultUpstream === upstream.name && (
                      <Badge variant="warning" className="text-[10px] h-4 px-1.5">
                        default
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeUpstream(upstream.name)}
                disabled={config.upstreams.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upstream.servers.map((server) => (
              <div
                key={server.address}
                className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted))] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                  <code className="text-sm font-mono text-[hsl(var(--foreground))]">
                    {server.address}
                  </code>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                  onClick={() => removeServer(upstream.name, server.address)}
                  disabled={upstream.servers.length <= 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Add server */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="10.0.0.1:9100"
                value={newServerInputs[upstream.name] ?? ''}
                onChange={(e) =>
                  setNewServerInputs((prev) => ({ ...prev, [upstream.name]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && addServer(upstream.name)}
                className="h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addServer(upstream.name)}
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add new upstream */}
      <Card className="border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add Upstream Group</CardTitle>
          <CardDescription className="text-xs">
            Create a new backend printer group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Group Name</Label>
              <Input
                placeholder="printer_floor2"
                value={newUpstreamName}
                onChange={(e) => setNewUpstreamName(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Server Address</Label>
              <Input
                placeholder="10.0.0.10:9100"
                value={newUpstreamAddr}
                onChange={(e) => setNewUpstreamAddr(e.target.value)}
                className="font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addUpstream()}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addUpstream}
            disabled={!newUpstreamName.trim() || !newUpstreamAddr.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            Add Upstream Group
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
