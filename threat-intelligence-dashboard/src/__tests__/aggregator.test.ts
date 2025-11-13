import { aggregateThreatData, calculateRiskLevel } from '@/utils/aggregator';
import { ThreatData } from '@/types/threat';

// ------------------------------------
// Mock Data Types (MATCHING aggregator.ts)
// ------------------------------------

interface AbuseIPDBData {
    ipAddress: string;
    isPublic: boolean;
    ipVersion: number;
    isWhitelisted: boolean;
    abuseConfidenceScore: number;
    countryCode: string;
    hostnames: string[] | null;
    isp: string;
    totalReports: number;
}

interface IPQSData {
    ip_address: string;
    country_code: string; 
    abuse_velocity: string;
    bot_status: boolean;
    host: string; // <-- **FIXED: Required for Hostname logic**
    vpn: boolean;
    proxy: boolean;
    fraud_score: number;
}

// NEW: Mock type for IPAPI
interface IPAPIData {
    ip: string;
    country_name: string; // Used for Country
    isp: string; // Used for ISP
    hostname: string; // Used for Hostname
    org: string; // Alternative for ISP/Organization name
}

// ------------------------------------
// AGGREGATION TESTS
// ------------------------------------

describe('Aggregator Utilities', () => {
    
    // IP Address constant
    const TEST_IP = '8.8.8.8';

    // Mock data setup
    const mockAbuseDB: AbuseIPDBData = {
        ipAddress: TEST_IP,
        isPublic: true,
        ipVersion: 4,
        isWhitelisted: false,
        abuseConfidenceScore: 45,
        countryCode: 'US',
        hostnames: ['google-dns.com'],
        isp: 'Google LLC (from AbuseDB)',
        totalReports: 100,
    };

    const mockIPQS: IPQSData = {
        ip_address: TEST_IP,
        host: 'dns-host-from-ipqs.net',
        vpn: false,
        proxy: false,
        fraud_score: 25,
        country_code: 'US',
        abuse_velocity: 'low',
        bot_status: false,
    };

    // NEW MOCK: Data from IPAPI (Primary source for Geolocation)
    const mockIPAPI: IPAPIData = {
        ip: TEST_IP,
        country_name: 'United States (from IPAPI)',
        isp: 'Google LLC (from IPAPI)',
        hostname: 'ipapi-dns.google',
        org: 'GOOGLE-ORG',
    };

    it('should aggregate data correctly from all three sources (prioritizing IPAPI)', () => {
        // **FIXED: Updated call signature to pass a single object**
        const result = aggregateThreatData({
            ipAddress: TEST_IP,
            abuseDB: mockAbuseDB,
            ipqs: mockIPQS,
            ipapi: mockIPAPI,
        });

        expect(result.ipAddress).toBe(TEST_IP);
        // Should take Hostname from IPAPI (ipapi-dns.google)
        expect(result.hostname).toBe(mockIPAPI.hostname); 
        // Should take ISP from IPAPI (Google LLC (from IPAPI))
        expect(result.isp).toBe(mockIPAPI.isp); 
        // Should take Country from IPAPI (United States (from IPAPI))
        expect(result.country).toBe(mockIPAPI.country_name);
        
        // Threat data from AbuseDB and IPQS
        expect(result.abuseScore).toBe(45);
        expect(result.fraudScore).toBe(25);
        expect(result.vpnProxyDetected).toBe(false);
    });
    
    // Testing Hostname fallback (if IPAPI fails)
    it('should fallback to AbuseDB hostname if IPAPI is null', () => {
        const result = aggregateThreatData({
            ipAddress: TEST_IP,
            abuseDB: mockAbuseDB,
            ipqs: mockIPQS,
            ipapi: null, // Simulate IPAPI failure
        });

        // Should fallback to AbuseDB hostname ('google-dns.com')
        expect(result.hostname).toBe(mockAbuseDB.hostnames![0]); 
        // Should fallback to AbuseDB ISP ('Google LLC (from AbuseDB)')
        expect(result.isp).toBe(mockAbuseDB.isp);
    });


    // Testing VPN/Proxy detection
    it('should detect VPN/Proxy if either flag is true', () => {
        // Create new instance based on the mock, changing vpn to true
        const ipqsWithVPN: IPQSData = { ...mockIPQS, vpn: true, proxy: false }; 
        
        // **FIXED: Updated call signature**
        const result = aggregateThreatData({
            ipAddress: TEST_IP,
            abuseDB: mockAbuseDB,
            ipqs: ipqsWithVPN,
            ipapi: mockIPAPI,
        });

        expect(result.vpnProxyDetected).toBe(true);
    });

});


// ------------------------------------
// RISK SCORING TESTS (BONUS LOGIC)
// ------------------------------------

describe('Risk Scoring Logic (calculateRiskLevel)', () => {

    // Base data for ThreatData
    const baseData: ThreatData = {
        ipAddress: '1.1.1.1',
        hostname: null, isp: 'ISP', country: 'XX', totalReports: 1,
        abuseScore: 0, fraudScore: 0, vpnProxyDetected: false,
    };

    // HIGH Risk Scenarios
    it('should return HIGH if Abuse Score is 75 or higher', () => {
        const data: ThreatData = { ...baseData, abuseScore: 75 };
        expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should return HIGH if VPN/Proxy is detected AND Fraud Score is 50 or higher', () => {
        const data: ThreatData = { ...baseData, vpnProxyDetected: true, fraudScore: 50, abuseScore: 10 };
        expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    // MEDIUM Risk Scenarios
    it('should return MEDIUM if Abuse Score is 30-74', () => {
        const data: ThreatData = { ...baseData, abuseScore: 35 };
        expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });
    
    it('should return MEDIUM if Fraud Score is 30-49', () => {
        const data: ThreatData = { ...baseData, fraudScore: 40 };
        expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });
    
    // LOW Risk Scenarios
    it('should return LOW if all scores are below 30 and no VPN/Proxy', () => {
        const data: ThreatData = { ...baseData, abuseScore: 29, fraudScore: 29, vpnProxyDetected: false };
        expect(calculateRiskLevel(data)).toBe('LOW');
    });
});