import { useState } from 'react'
import { Printer, LayoutDashboard, GitBranch, Server, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseNginxConfig, DEFAULT_CONFIG } from '@/lib/nginxParser'
import { DashboardPanel } from '@/components/DashboardPanel'
import { IpMappingPanel } from '@/components/IpMappingPanel'
import { UpstreamsPanel } from '@/components/UpstreamsPanel'
import { ConfigEditorPanel } from '@/components/ConfigEditorPanel'
import { GeneralPanel } from '@/components/GeneralPanel'
import type { NginxConfig } from '@/types/nginx'

// Pre-load with the orderbird config
const INITIAL_RAW = `load_module modules/ngx_stream_module.so;worker_processes auto;events { worker_connections 1024; }stream {log_format tcp_router'ts=$time_local msec=$msec ''$remote_addr:$remote_port -> $upstream_addr ''status=$status bytes_sent=$bytes_sent bytes_received=$bytes_received ''time=$session_time';access_log /var/log/nginx/tcp_router_9100.log tcp_router;map $remote_addr $printer_upstream {default printer_down;10.1.0.30 printer_down;10.1.0.31 printer_down;10.1.0.32 printer_up;10.1.0.33 printer_up;10.1.0.34 printer_up;}upstream printer_down { server 10.1.0.11:9100; }upstream printer_up { server 10.1.0.12:9100; }server {listen 9100;proxy_pass $printer_upstream;}}`

function loadInitial(): NginxConfig {
  try {
    return parseNginxConfig(INITIAL_RAW)
  } catch {
    return DEFAULT_CONFIG
  }
}

type Tab = 'dashboard' | 'general' | 'upstreams' | 'mapping' | 'config'

const TABS: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'Overview & routing diagram',
  },
  {
    id: 'general',
    label: 'General',
    icon: <Server className="h-4 w-4" />,
    description: 'Port & logging settings',
  },
  {
    id: 'upstreams',
    label: 'Upstreams',
    icon: <Printer className="h-4 w-4" />,
    description: 'Printer backend groups',
  },
  {
    id: 'mapping',
    label: 'IP Routing',
    icon: <GitBranch className="h-4 w-4" />,
    description: 'Map IPs to printers',
  },
  {
    id: 'config',
    label: 'Config',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Generated nginx.conf',
  },
]

export default function App() {
  const [config, setConfig] = useState<NginxConfig>(loadInitial)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))] flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--border))]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(240,70%,52%)] shadow-lg shadow-[hsl(217,91%,60%)]/25">
            <Printer className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none tracking-tight">orderbird</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-none font-medium tracking-wide uppercase">
              Printer Driver
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                activeTab === tab.id
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              {activeTab === tab.id && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[hsl(var(--primary))]" />
              )}
              <span
                className={cn(
                  'transition-colors',
                  activeTab === tab.id
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                )}
              >
                {tab.icon}
              </span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <div className="rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-2.5">
            <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5">
              Live Status
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-60" />
                <div className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
              </div>
              <p className="text-xs font-medium text-[hsl(var(--foreground))]">
                :{config.listenPort}
              </p>
              <span className="text-[hsl(var(--border))]">·</span>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {config.upstreams.length} upstreams
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">{activeTabMeta.label}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{activeTabMeta.description}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-3 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
              nginx stream · port {config.listenPort}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPanel config={config} />}
            {activeTab === 'general' && <GeneralPanel config={config} onChange={setConfig} />}
            {activeTab === 'upstreams' && <UpstreamsPanel config={config} onChange={setConfig} />}
            {activeTab === 'mapping' && <IpMappingPanel config={config} onChange={setConfig} />}
            {activeTab === 'config' && <ConfigEditorPanel config={config} onChange={setConfig} />}
          </div>
        </main>
      </div>
    </div>
  )
}
