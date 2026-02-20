import { useState } from 'react'
import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@heroui/react'
import { Copy, Check, Download, Upload, Edit3, AlertTriangle } from 'lucide-react'
import { serializeNginxConfig, parseNginxConfig } from '@/lib/nginxParser'
import type { NginxConfig } from '@/types/nginx'

interface Props { config: NginxConfig; onChange: (c: NginxConfig) => void }

export function ConfigEditorPanel({ config, onChange }: Props) {
  const [copied,     setCopied]     = useState(false)
  const [rawEdit,    setRawEdit]    = useState('')
  const [editMode,   setEditMode]   = useState(false)
  const [parseError, setParseError] = useState('')

  const configText = serializeNginxConfig(config)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([configText], { type: 'text/plain' }))
    a.download = 'nginx.conf'
    a.click()
  }

  const enterEdit = () => { setRawEdit(configText); setParseError(''); setEditMode(true) }

  const applyEdit = () => {
    try { onChange(parseNginxConfig(rawEdit)); setParseError(''); setEditMode(false) }
    catch (e) { setParseError(String(e)) }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { onChange(parseNginxConfig(ev.target?.result as string)); setParseError('') }
      catch (err) { setParseError(String(err)) }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <Card className="border border-default-200 bg-content1 shadow-sm" shadow="none">
        <CardHeader className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Generierte Konfiguration</p>
            <p className="text-[12px] text-default-400">Live nginx.conf basierend auf deinen Einstellungen</p>
          </div>
          <Chip size="sm" color="success" variant="flat" classNames={{ content: 'text-[11px] font-semibold' }}>
            nginx stream
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="px-5 py-4 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="flat" onPress={handleCopy}
              startContent={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              color={copied ? 'success' : 'default'}>
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
            <Button size="sm" variant="flat" startContent={<Download className="h-3.5 w-3.5" />} onPress={handleDownload}>
              Download
            </Button>
            <label className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-default-100 hover:bg-default-200 px-3 text-[13px] font-medium cursor-pointer transition-colors text-default-600">
              <Upload className="h-3.5 w-3.5" />
              Importieren
              <input type="file" accept=".conf,.txt" className="hidden" onChange={handleUpload} />
            </label>
            {!editMode ? (
              <Button size="sm" variant="flat" className="ml-auto"
                startContent={<Edit3 className="h-3.5 w-3.5" />} onPress={enterEdit}>
                Bearbeiten
              </Button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="light" onPress={() => setEditMode(false)}>Abbrechen</Button>
                <Button size="sm" color="primary" startContent={<Check className="h-3.5 w-3.5" />} onPress={applyEdit}>
                  Übernehmen
                </Button>
              </div>
            )}
          </div>

          {parseError && (
            <div className="flex items-start gap-2 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/30 p-3">
              <AlertTriangle className="h-4 w-4 text-danger-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-danger-600 dark:text-danger-400">{parseError}</p>
            </div>
          )}

          {editMode ? (
            <textarea
              value={rawEdit}
              onChange={(e) => setRawEdit(e.target.value)}
              className="w-full rounded-xl border border-default-200 bg-default-50 dark:bg-default-50/5 p-4 font-mono text-[12px] text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[480px]"
              spellCheck={false}
            />
          ) : (
            <pre className="rounded-xl border border-default-100 bg-default-50 dark:bg-default-50/5 p-4 font-mono text-[12px] leading-relaxed overflow-x-auto min-h-[480px] whitespace-pre">
              <ConfigHighlight text={configText} />
            </pre>
          )}
        </CardBody>
      </Card>

      <Card className="border border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/5 shadow-sm" shadow="none">
        <CardBody className="px-5 py-3">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-warning-600 dark:text-warning-400">!</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-warning-700 dark:text-warning-400 mb-0.5">Deployment</p>
              <p className="text-[12px] text-default-500">
                Konfiguration kopieren nach{' '}
                <code className="font-mono text-foreground text-[11px]">/etc/nginx/nginx.conf</code>
                {' '}und dann{' '}
                <code className="font-mono text-foreground text-[11px]">nginx -t && systemctl reload nginx</code>
                {' '}ausführen.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function ConfigHighlight({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const t = line.trimStart()
        let color = 'inherit'
        if (t.startsWith('#'))                         color = '#8b949e'
        else if (/^(upstream|server|stream|events|map)\b/.test(t)) color = '#4fa3f7'
        else if (/^(load_module|worker)/.test(t))      color = '#a78bfa'
        else if (/^\d+\.\d+\.\d+\.\d+/.test(t))       color = '#3fb950'
        else if (/^(listen|proxy_pass|access_log|log_format)/.test(t)) color = '#d29922'
        return <span key={i} style={{ color, display: 'block' }}>{line || ' '}</span>
      })}
    </>
  )
}
