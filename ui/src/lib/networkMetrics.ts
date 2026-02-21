/**
 * Deterministic network metrics for a device.
 *
 * For LAN devices: always stable/excellent.
 * For WLAN devices: derived from the IP address so values are consistent across
 * renders but look realistic. In a real deployment these would come from nginx
 * access-log aggregation (error status, session_time, bytes counters).
 */

export type SignalLevel = 'excellent' | 'good' | 'fair' | 'poor'
export type RiskLevel   = 'low' | 'medium' | 'high' | 'critical'

export interface DeviceMetrics {
  /** 0–100 % – signal quality (WLAN) or link reliability (LAN) */
  signal: number
  /** Signal label */
  signalLevel: SignalLevel
  /** Error / failed-print rate in % */
  errorRate: number
  /** Average print-job round-trip latency in ms */
  latencyMs: number
  /** Estimated connection dropout events per day */
  dropsPerDay: number
  /** Timeout risk category */
  timeoutRisk: RiskLevel
  /** Whether this device needs attention */
  needsAttention: boolean
}

/** Seeded pseudo-RNG so values are stable per IP */
function seededRng(ip: string, slot: number): number {
  const n = ip.split('.').reduce((acc, oct) => acc * 256 + parseInt(oct, 10), 0)
  const x = Math.sin(n * 9301 + slot * 49297 + 233720) * 10000
  return x - Math.floor(x)
}

function signalLevel(pct: number): SignalLevel {
  if (pct >= 85) return 'excellent'
  if (pct >= 70) return 'good'
  if (pct >= 55) return 'fair'
  return 'poor'
}

function timeoutRisk(pct: number): RiskLevel {
  if (pct >= 80) return 'low'
  if (pct >= 65) return 'medium'
  if (pct >= 50) return 'high'
  return 'critical'
}

export function deviceMetrics(ip: string, type: 'LAN' | 'WLAN' | undefined): DeviceMetrics {
  if (type !== 'WLAN') {
    return {
      signal: 99,
      signalLevel: 'excellent',
      errorRate: 0.05,
      latencyMs: 0.4,
      dropsPerDay: 0,
      timeoutRisk: 'low',
      needsAttention: false,
    }
  }

  const signal     = Math.round(48 + seededRng(ip, 1) * 47)   // 48 – 95 %
  const errorRate  = parseFloat((0.2 + seededRng(ip, 2) * 5.8).toFixed(1))  // 0.2 – 6 %
  const latencyMs  = Math.round(6   + seededRng(ip, 3) * 24)   // 6 – 30 ms
  const dropsPerDay = Math.round(seededRng(ip, 4) * (signal < 65 ? 8 : 3))   // 0 – 8

  return {
    signal,
    signalLevel: signalLevel(signal),
    errorRate,
    latencyMs,
    dropsPerDay,
    timeoutRisk: timeoutRisk(signal),
    needsAttention: signal < 70 || errorRate > 3,
  }
}

/** Aggregate metrics across a set of devices */
export function aggregateMetrics(devices: Array<{ ip: string; type: 'LAN' | 'WLAN' | undefined }>) {
  const all = devices.map((d) => deviceMetrics(d.ip, d.type))
  const avg  = (key: keyof DeviceMetrics) =>
    all.length ? all.reduce((s, m) => s + (m[key] as number), 0) / all.length : 0

  return {
    avgSignal:    Math.round(avg('signal')),
    avgErrorRate: parseFloat(avg('errorRate').toFixed(2)),
    avgLatencyMs: parseFloat(avg('latencyMs').toFixed(1)),
    avgDrops:     parseFloat(avg('dropsPerDay').toFixed(1)),
    atRisk:       all.filter((m) => m.needsAttention).length,
  }
}

export const SIGNAL_COLOR: Record<SignalLevel, string> = {
  excellent: '#3fb950',
  good:      '#4fa3f7',
  fair:      '#d29922',
  poor:      '#f85149',
}

export const RISK_COLOR: Record<RiskLevel, string> = {
  low:      '#3fb950',
  medium:   '#d29922',
  high:     '#f85149',
  critical: '#ff6b6b',
}

export const SIGNAL_LABEL: Record<SignalLevel, string> = {
  excellent: 'Sehr gut',
  good:      'Gut',
  fair:      'Mittel',
  poor:      'Schwach',
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  low:      'Niedrig',
  medium:   'Mittel',
  high:     'Hoch',
  critical: 'Kritisch',
}
