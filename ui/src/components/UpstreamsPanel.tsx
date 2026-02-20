import { useState } from 'react'
import { Card, CardBody, CardHeader, Button, Input, Chip, Divider } from '@heroui/react'
import { Plus, Trash2, Server, Edit2, Check, X } from 'lucide-react'
import type { NginxConfig, Upstream } from '@/types/nginx'

interface Props { config: NginxConfig; onChange: (c: NginxConfig) => void }

function EditableName({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const commit = () => { if (val.trim() && val.trim() !== name) onRename(val.trim()); setEditing(false) }

  if (editing) return (
    <div className="flex items-center gap-1">
      <Input size="sm" value={val} onValueChange={setVal}
        classNames={{ inputWrapper: 'h-7', input: 'font-mono text-xs w-32' }}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus />
      <Button isIconOnly size="sm" variant="light" color="success" onPress={commit}><Check className="h-3 w-3" /></Button>
      <Button isIconOnly size="sm" variant="light" onPress={() => setEditing(false)}><X className="h-3 w-3" /></Button>
    </div>
  )
  return (
    <button className="flex items-center gap-1.5 group/n text-left" onClick={() => { setVal(name); setEditing(true) }}>
      <span className="font-mono font-semibold text-[13px] text-foreground">{name}</span>
      <Edit2 className="h-3 w-3 text-default-300 opacity-0 group-hover/n:opacity-100 transition-opacity" />
    </button>
  )
}

export function UpstreamsPanel({ config, onChange }: Props) {
  const [newName, setNewName] = useState('')
  const [newAddr, setNewAddr] = useState('')
  const [newServerInputs, setNewServerInputs] = useState<Record<string, string>>({})

  const addUpstream = () => {
    const name = newName.trim(); const addr = newAddr.trim()
    if (!name || !addr || config.upstreams.find((u) => u.name === name)) return
    onChange({ ...config, upstreams: [...config.upstreams, { name, servers: [{ address: addr }] }] })
    setNewName(''); setNewAddr('')
  }

  const removeUpstream = (name: string) =>
    onChange({
      ...config,
      upstreams: config.upstreams.filter((u) => u.name !== name),
      ipMappings: config.ipMappings.map((m) => m.upstream === name ? { ...m, upstream: config.defaultUpstream } : m),
    })

  const renameUpstream = (old: string, next: string) =>
    onChange({
      ...config,
      upstreams: config.upstreams.map((u) => u.name === old ? { ...u, name: next } : u),
      ipMappings: config.ipMappings.map((m) => m.upstream === old ? { ...m, upstream: next } : m),
      defaultUpstream: config.defaultUpstream === old ? next : config.defaultUpstream,
    })

  const addServer = (uName: string) => {
    const addr = (newServerInputs[uName] ?? '').trim()
    if (!addr) return
    onChange({ ...config, upstreams: config.upstreams.map((u) => u.name === uName ? { ...u, servers: [...u.servers, { address: addr }] } : u) })
    setNewServerInputs((p) => ({ ...p, [uName]: '' }))
  }

  const removeServer = (uName: string, addr: string) =>
    onChange({ ...config, upstreams: config.upstreams.map((u) => u.name === uName ? { ...u, servers: u.servers.filter((s) => s.address !== addr) } : u) })

  const usage = (name: string) => config.ipMappings.filter((m) => m.upstream === name).length

  return (
    <div className="space-y-4">
      {config.upstreams.map((upstream: Upstream) => (
        <Card key={upstream.name} className="border border-default-200 bg-content1 shadow-sm group" shadow="none">
          <CardHeader className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10">
                  <Server className="h-4 w-4 text-primary-400" />
                </div>
                <div>
                  <EditableName name={upstream.name} onRename={(n) => renameUpstream(upstream.name, n)} />
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Chip size="sm" variant="flat" classNames={{ base: 'h-4', content: 'text-[10px]' }}>
                      {upstream.servers.length} Server
                    </Chip>
                    <Chip size="sm" color={usage(upstream.name) > 0 ? 'success' : 'default'} variant="flat"
                      classNames={{ base: 'h-4', content: 'text-[10px]' }}>
                      {usage(upstream.name)} Kassen
                    </Chip>
                    {config.defaultUpstream === upstream.name && (
                      <Chip size="sm" color="warning" variant="flat" classNames={{ base: 'h-4', content: 'text-[10px]' }}>
                        Standard
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
              <Button isIconOnly size="sm" variant="light" color="danger"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => removeUpstream(upstream.name)}
                isDisabled={config.upstreams.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="px-5 py-4 space-y-2">
            {upstream.servers.map((server) => (
              <div key={server.address}
                className="flex items-center justify-between rounded-lg border border-default-100 bg-default-50 dark:bg-default-50/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-success-400" />
                  <code className="text-[13px] font-mono text-foreground">{server.address}</code>
                </div>
                <Button isIconOnly size="sm" variant="light" color="danger"
                  onPress={() => removeServer(upstream.name, server.address)}
                  isDisabled={upstream.servers.length <= 1}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input size="sm" placeholder="10.0.0.1:9100"
                value={newServerInputs[upstream.name] ?? ''}
                onValueChange={(v) => setNewServerInputs((p) => ({ ...p, [upstream.name]: v }))}
                onKeyDown={(e) => e.key === 'Enter' && addServer(upstream.name)}
                classNames={{ input: 'font-mono text-xs' }} />
              <Button size="sm" variant="flat" color="primary"
                onPress={() => addServer(upstream.name)}
                startContent={<Plus className="h-3 w-3" />}>
                Add
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}

      <Card className="border border-dashed border-default-200 bg-content1 shadow-sm" shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-col items-start gap-0.5">
          <p className="text-[14px] font-semibold text-foreground">Neue Druckergruppe</p>
          <p className="text-[12px] text-default-400">Neuen Backend-Drucker anlegen</p>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Gruppenname" placeholder="printer_floor2" size="sm"
              value={newName} onValueChange={setNewName} classNames={{ input: 'font-mono' }} />
            <Input label="Server-Adresse" placeholder="10.0.0.10:9100" size="sm"
              value={newAddr} onValueChange={setNewAddr}
              onKeyDown={(e) => e.key === 'Enter' && addUpstream()}
              classNames={{ input: 'font-mono' }} />
          </div>
          <Button color="primary" variant="flat" size="sm" fullWidth
            startContent={<Plus className="h-4 w-4" />}
            onPress={addUpstream} isDisabled={!newName.trim() || !newAddr.trim()}>
            Druckergruppe hinzufügen
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
