import type { NginxConfig, Upstream, IpMapping } from '@/types/nginx'

/**
 * Parse the raw nginx stream config string into a structured NginxConfig object.
 * Handles both minified and formatted configs.
 */
export function parseNginxConfig(raw: string): NginxConfig {
  // Normalize whitespace
  const text = raw.replace(/\s+/g, ' ').trim()

  // Extract listen port
  const listenMatch = text.match(/listen\s+(\d+)/)
  const listenPort = listenMatch ? parseInt(listenMatch[1], 10) : 9100

  // Extract log path
  const logMatch = text.match(/access_log\s+(\S+)\s/)
  const logPath = logMatch ? logMatch[1] : '/var/log/nginx/tcp_router.log'

  // Extract log format name
  const logFormatMatch = text.match(/log_format\s+(\S+)\s+['"]/)
  const logFormat = logFormatMatch ? logFormatMatch[1] : 'tcp_router'

  // Extract upstreams
  const upstreams: Upstream[] = []
  const upstreamRegex = /upstream\s+(\S+)\s*\{([^}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = upstreamRegex.exec(text)) !== null) {
    const name = m[1]
    const body = m[2]
    const servers = [...body.matchAll(/server\s+(\S+);/g)].map((s) => ({
      address: s[1],
    }))
    upstreams.push({ name, servers })
  }

  // Extract map block: map $remote_addr $printer_upstream { ... }
  const mapMatch = text.match(/map\s+\$remote_addr\s+\$\w+\s*\{([^}]+)\}/)
  const ipMappings: IpMapping[] = []
  let defaultUpstream = upstreams[0]?.name ?? 'printer_down'

  if (mapMatch) {
    const mapBody = mapMatch[1]
    const entries = mapBody.matchAll(/(\S+)\s+(\S+);/g)
    for (const entry of entries) {
      const key = entry[1]
      const val = entry[2].replace(';', '')
      if (key === 'default') {
        defaultUpstream = val
      } else {
        ipMappings.push({ ip: key, upstream: val })
      }
    }
  }

  return { listenPort, defaultUpstream, upstreams, ipMappings, logPath, logFormat }
}

/**
 * Serialize a NginxConfig back into a formatted nginx config string.
 */
export function serializeNginxConfig(config: NginxConfig): string {
  const { listenPort, defaultUpstream, upstreams, ipMappings, logPath, logFormat } = config

  const mapEntries = [
    `    default ${defaultUpstream};`,
    ...ipMappings.map((m) => `    ${m.ip} ${m.upstream};`),
  ].join('\n')

  const upstreamBlocks = upstreams
    .map((u) => {
      const servers = u.servers.map((s) => `  server ${s.address};`).join('\n')
      return `upstream ${u.name} {\n${servers}\n}`
    })
    .join('\n\n')

  return `load_module modules/ngx_stream_module.so;

worker_processes auto;

events {
  worker_connections 1024;
}

stream {
  log_format ${logFormat}
    'ts=$time_local msec=$msec '
    '$remote_addr:$remote_port -> $upstream_addr '
    'status=$status bytes_sent=$bytes_sent bytes_received=$bytes_received '
    'time=$session_time';

  access_log ${logPath} ${logFormat};

  map $remote_addr $printer_upstream {
${mapEntries}
  }

${upstreamBlocks}

  server {
    listen ${listenPort};
    proxy_pass $printer_upstream;
  }
}
`
}

export const DEFAULT_CONFIG: NginxConfig = {
  listenPort: 9100,
  defaultUpstream: 'printer_down',
  logPath: '/var/log/nginx/tcp_router_9100.log',
  logFormat: 'tcp_router',
  upstreams: [
    { name: 'printer_down', servers: [{ address: '10.1.0.11:9100' }] },
    { name: 'printer_up', servers: [{ address: '10.1.0.12:9100' }] },
  ],
  ipMappings: [
    { ip: '10.1.0.30', upstream: 'printer_down' },
    { ip: '10.1.0.31', upstream: 'printer_down' },
    { ip: '10.1.0.32', upstream: 'printer_up' },
    { ip: '10.1.0.33', upstream: 'printer_up' },
    { ip: '10.1.0.34', upstream: 'printer_up' },
  ],
}
