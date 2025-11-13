export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface ThreatData {
  ipAddress: string;
  hostname: string | null;
  isp: string | null;
  country: string | null;
  abuseScore: number;
  totalReports: number;
  vpnProxyDetected: boolean;
  fraudScore: number;
}

export interface ThreatState {
  data: ThreatData | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  history: ThreatData[];
}