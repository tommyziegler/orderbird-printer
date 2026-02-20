import { useState } from 'react'
import { Copy, Check, Download, Upload, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { serializeNginxConfig, parseNginxConfig } from '@/lib/nginxParser'
import type { NginxConfig } from '@/types/nginx'

interface ConfigEditorPanelProps {
  config: NginxConfig
  onChange: (config: NginxConfig) => void
}

export function ConfigEditorPanel({ config, onChange }: ConfigEditorPanelProps) {
  const [copied, setCopied] = useState(false)
  const [rawEdit, setRawEdit] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [parseError, setParseError] = useState('')

  const configText = serializeNginxConfig(config)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([configText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nginx.conf'
    a.click()
    URL.revokeObjectURL(url)
  }

  const enterEditMode = () => {
    setRawEdit(configText)
    setParseError('')
    setEditMode(true)
  }

  const applyEdit = () => {
    try {
      const parsed = parseNginxConfig(rawEdit)
      onChange(parsed)
      setParseError('')
      setEditMode(false)
    } catch (e) {
      setParseError(String(e))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        const parsed = parseNginxConfig(text)
        onChange(parsed)
        setParseError('')
      } catch (err) {
        setParseError(String(err))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Generated Config</CardTitle>
              <CardDescription className="text-xs mt-1">
                Live-generated nginx.conf based on your settings
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px]">
                nginx stream
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 gap-1.5">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-8 gap-1.5">
              <Download className="h-3 w-3" />
              Download
            </Button>
            <label className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-transparent px-3 text-xs font-medium cursor-pointer transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]">
              <Upload className="h-3 w-3" />
              Import
              <input
                type="file"
                accept=".conf,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {!editMode ? (
              <Button size="sm" variant="outline" onClick={enterEditMode} className="h-8 gap-1.5 ml-auto">
                <RefreshCw className="h-3 w-3" />
                Edit Raw
              </Button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)} className="h-8">
                  Cancel
                </Button>
                <Button size="sm" variant="success" onClick={applyEdit} className="h-8">
                  <Check className="h-3 w-3" />
                  Apply
                </Button>
              </div>
            )}
          </div>

          {parseError && (
            <div className="flex items-start gap-2 rounded-lg bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 p-3">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))] shrink-0 mt-0.5" />
              <p className="text-xs text-[hsl(var(--destructive))]">{parseError}</p>
            </div>
          )}

          {/* Code view / editor */}
          {editMode ? (
            <textarea
              value={rawEdit}
              onChange={(e) => setRawEdit(e.target.value)}
              className="w-full rounded-lg bg-[hsl(var(--muted))] p-4 font-mono text-xs text-[hsl(var(--foreground))] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] min-h-[480px] border border-[hsl(var(--border))]"
              spellCheck={false}
            />
          ) : (
            <pre className="rounded-lg bg-[hsl(var(--muted))] p-4 font-mono text-xs text-[hsl(var(--foreground))] leading-relaxed overflow-x-auto min-h-[480px] whitespace-pre">
              <ConfigHighlight text={configText} />
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Deploy hint */}
      <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="h-5 w-5 rounded-full bg-[hsl(var(--warning))]/20 flex items-center justify-center">
                <span className="text-[10px] text-[hsl(var(--warning))] font-bold">!</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[hsl(var(--warning))]">Deployment</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Copy the generated config to{' '}
                <code className="font-mono text-[hsl(var(--foreground))]">/etc/nginx/nginx.conf</code>{' '}
                on your server, then run{' '}
                <code className="font-mono text-[hsl(var(--foreground))]">nginx -t && systemctl reload nginx</code>{' '}
                to apply without downtime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfigHighlight({ text }: { text: string }) {
  // Simple syntax highlighting with spans
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trimStart()
        let color = 'inherit'
        if (trimmed.startsWith('#')) color = 'hsl(var(--muted-foreground))'
        else if (trimmed.startsWith('upstream') || trimmed.startsWith('server') || trimmed.startsWith('stream') || trimmed.startsWith('events') || trimmed.startsWith('map')) color = 'hsl(210,80%,65%)'
        else if (trimmed.startsWith('load_module') || trimmed.startsWith('worker')) color = 'hsl(280,60%,70%)'
        else if (trimmed.match(/^\d+\.\d+\.\d+\.\d+/)) color = 'hsl(142,60%,55%)'
        else if (trimmed.startsWith('listen') || trimmed.startsWith('proxy_pass') || trimmed.startsWith('access_log') || trimmed.startsWith('log_format')) color = 'hsl(38,90%,60%)'

        return (
          <span key={i} style={{ color, display: 'block' }}>
            {line || ' '}
          </span>
        )
      })}
    </>
  )
}
