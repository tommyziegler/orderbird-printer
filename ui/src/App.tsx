import { useState, useEffect } from 'react'
import {
  Button,
  Chip,
  Divider,
  Tooltip,
} from '@heroui/react'
import {
  Printer,
  LayoutDashboard,
  Settings,
  FileCode,
  Monitor,
  Moon,
  Sun,
  Wifi,
  Network,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseNginxConfig, DEFAULT_CONFIG } from '@/lib/nginxParser'
import { DashboardPanel } from '@/components/DashboardPanel'
import { KassenPanel } from '@/components/IpMappingPanel'
import { UpstreamsPanel } from '@/components/UpstreamsPanel'
import { ConfigEditorPanel } from '@/components/ConfigEditorPanel'
import { GeneralPanel } from '@/components/GeneralPanel'
import type { NginxConfig } from '@/types/nginx'

const INITIAL_RAW = `load_module modules/ngx_stream_module.so;worker_processes auto;events { worker_connections 1024; }stream {log_format tcp_router'ts=$time_local msec=$msec ''$remote_addr:$remote_port -> $upstream_addr ''status=$status bytes_sent=$bytes_sent bytes_received=$bytes_received ''time=$session_time';access_log /var/log/nginx/tcp_router_9100.log tcp_router;map $remote_addr $printer_upstream {default printer_down;10.1.0.30 printer_down;10.1.0.31 printer_down;10.1.0.32 printer_up;10.1.0.33 printer_up;10.1.0.34 printer_up;}upstream printer_down { server 10.1.0.11:9100; }upstream printer_up { server 10.1.0.12:9100; }server {listen 9100;proxy_pass $printer_upstream;}}`

function loadInitial(): NginxConfig {
  try { return parseNginxConfig(INITIAL_RAW) } catch { return DEFAULT_CONFIG }
}

type Tab = 'dashboard' | 'kassen' | 'drucker' | 'einstellungen' | 'config'

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'dashboard',    label: 'Übersicht',     icon: <LayoutDashboard className="h-4 w-4" />, description: 'Routing & Statistiken' },
  { id: 'kassen',       label: 'Kassen',         icon: <Monitor className="h-4 w-4" />,        description: 'POS-Terminals' },
  { id: 'drucker',      label: 'Drucker',        icon: <Printer className="h-4 w-4" />,        description: 'Druckergruppen' },
  { id: 'einstellungen',label: 'Einstellungen',  icon: <Settings className="h-4 w-4" />,       description: 'Port & Logging' },
  { id: 'config',       label: 'Konfiguration',  icon: <FileCode className="h-4 w-4" />,       description: 'nginx.conf' },
]

export default function App() {
  const [config, setConfig]     = useState<NginxConfig>(loadInitial)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [dark, setDark]         = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!
  const lanCount  = config.ipMappings.filter((m) => m.connectionType !== 'WLAN').length
  const wlanCount = config.ipMappings.filter((m) => m.connectionType === 'WLAN').length

  const sidebarBg  = dark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'
  const mainBg     = dark ? 'bg-[#0d1117]' : 'bg-[#f4f5f7]'
  const headerBg   = dark ? 'bg-[#161b22]/90 border-[#21262d]' : 'bg-white/90 border-slate-200'
  const navActive  = dark ? 'bg-primary-500/10 text-primary-400' : 'bg-primary-50 text-primary-600'
  const navInactive = dark ? 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  const textPrimary = dark ? 'text-[#e6edf3]' : 'text-[#1a1f36]'
  const textMuted   = dark ? 'text-[#8b949e]' : 'text-slate-500'

  return (
    <div className={cn('flex min-h-screen', mainBg)}>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={cn('w-[220px] shrink-0 flex flex-col border-r', sidebarBg)}>

        {/* Brand */}
        <div className={cn('flex items-center gap-3 px-5 py-[18px] border-b', dark ? 'border-[#21262d]' : 'border-slate-200')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <Printer className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className={cn('text-[13px] font-bold leading-none tracking-tight', textPrimary)}>
              orderbird
            </p>
            <p className={cn('text-[10px] leading-none mt-0.5 font-medium uppercase tracking-widest', textMuted)}>
              Drucker Manager
            </p>
          </div>
        </div>

        {/* Nav section */}
        <div className="px-3 pt-4 pb-2">
          <p className={cn('text-[10px] font-semibold uppercase tracking-widest px-2 mb-1', textMuted)}>
            Navigation
          </p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] font-medium transition-all',
                activeTab === tab.id ? navActive : navInactive
              )}
            >
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary-500" />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <Divider className={dark ? 'bg-[#21262d]' : 'bg-slate-200'} />

        {/* Status widget */}
        <div className="p-3 space-y-2">
          <div className={cn('rounded-lg border p-3 text-[12px] space-y-2', dark ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-50 border-slate-200')}>
            <div className="flex items-center justify-between">
              <span className={cn('font-semibold uppercase tracking-wide text-[10px]', textMuted)}>Status</span>
              <Chip size="sm" color="success" variant="flat" classNames={{ base: 'h-4', content: 'text-[10px] px-1 font-semibold' }}>
                Aktiv
              </Chip>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-success-500" />
                <span className={textMuted}>Port {config.listenPort}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Network className="h-3 w-3 text-primary-400" />
                <span className={textMuted}>{lanCount} LAN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-warning-400" />
                <span className={textMuted}>{wlanCount} WLAN</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className={cn('border-b flex items-center justify-between px-8 py-3 backdrop-blur-sm sticky top-0 z-10', headerBg)}>
          <div className="flex items-center gap-3">
            <div>
              <h1 className={cn('text-[15px] font-semibold leading-tight', textPrimary)}>
                {activeTabMeta.label}
              </h1>
              <p className={cn('text-[12px]', textMuted)}>{activeTabMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Chip
              startContent={<Printer className="h-3 w-3" />}
              size="sm"
              color="primary"
              variant="flat"
              classNames={{ content: 'text-[11px] font-medium' }}
            >
              {config.upstreams.length} Drucker · {config.ipMappings.length} Kassen
            </Chip>

            <Tooltip content={dark ? 'Light Mode' : 'Dark Mode'} placement="bottom">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setDark(!dark)}
                className={dark ? 'text-[#8b949e] hover:text-[#e6edf3]' : 'text-slate-500 hover:text-slate-800'}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </Tooltip>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard'     && <DashboardPanel config={config} dark={dark} />}
            {activeTab === 'kassen'        && <KassenPanel    config={config} onChange={setConfig} dark={dark} />}
            {activeTab === 'drucker'       && <UpstreamsPanel config={config} onChange={setConfig} />}
            {activeTab === 'einstellungen' && <GeneralPanel   config={config} onChange={setConfig} />}
            {activeTab === 'config'        && <ConfigEditorPanel config={config} onChange={setConfig} />}
          </div>
        </main>
      </div>
    </div>
  )
}
