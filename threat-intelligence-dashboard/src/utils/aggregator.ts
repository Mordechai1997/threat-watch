import { ThreatData, RiskLevel } from '@/types/threat';
import { RISK_THRESHOLDS } from '@/constants';

// API Response Types
interface AbuseIPDBData {
    ipAddress: string;
    abuseConfidenceScore: number;
    totalReports: number;
    countryCode: string;
    hostnames: string[] | null;
    isp: string;
}

interface IPQSData {
    ip_address: string;
    country_code: string;
    host: string;
    abuse_velocity: string;
    vpn: boolean;
    proxy: boolean;
    bot_status: boolean;
    fraud_score: number;
}

interface IPAPIData {
    ip: string;
    country_name: string;
    isp: string;
    hostname: string;
    org: string;
}

interface AggregationInput {
    ipAddress: string;
    abuseDB: AbuseIPDBData | null;
    ipqs: IPQSData | null;
    ipapi: IPAPIData | null;
}

// Aggregation
export const aggregateThreatData = (
    { ipAddress, abuseDB, ipqs, ipapi }: AggregationInput
): ThreatData => {
    return {
        ipAddress,
        hostname: ipapi?.hostname || abuseDB?.hostnames?.[0] || ipqs?.host || null,
        isp: ipapi?.isp || ipapi?.org || abuseDB?.isp || null,
        country: ipapi?.country_name || abuseDB?.countryCode || null,
        abuseScore: abuseDB?.abuseConfidenceScore || 0,
        totalReports: abuseDB?.totalReports || 0,
        vpnProxyDetected: Boolean(ipqs?.vpn || ipqs?.proxy),
        fraudScore: ipqs?.fraud_score || 0,
    };
};

// Risk Calculation
export const calculateRiskLevel = (data: ThreatData): RiskLevel => {
    const { abuseScore, fraudScore, vpnProxyDetected } = data;

    if (
        abuseScore >= RISK_THRESHOLDS.ABUSE_HIGH ||
        (vpnProxyDetected && fraudScore >= RISK_THRESHOLDS.FRAUD_HIGH)
    ) {
        return 'HIGH';
    }

    if (
        abuseScore >= RISK_THRESHOLDS.ABUSE_MEDIUM ||
        fraudScore >= RISK_THRESHOLDS.FRAUD_MEDIUM
    ) {
        return 'MEDIUM';
    }

    return 'LOW';
};  