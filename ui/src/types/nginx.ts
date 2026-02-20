export interface UpstreamServer {
  address: string; // e.g. "10.1.0.11:9100"
}

export interface Upstream {
  name: string; // e.g. "printer_down"
  servers: UpstreamServer[];
}

export interface IpMapping {
  ip: string;                         // e.g. "10.1.0.30"
  upstream: string;                   // e.g. "printer_down"
  name?: string;                      // friendly label e.g. "Kasse 1"
  connectionType?: 'LAN' | 'WLAN';   // network type for display
}

export interface NginxConfig {
  listenPort: number;
  defaultUpstream: string;
  upstreams: Upstream[];
  ipMappings: IpMapping[];
  logPath: string;
  logFormat: string;
}
