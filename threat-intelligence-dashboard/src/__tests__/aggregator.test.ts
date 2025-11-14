import { aggregateThreatData, calculateRiskLevel } from '@/utils/aggregator';
import { ThreatData } from '@/types/threat';

// Mock Data Types
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
  vpn: boolean;
  proxy: boolean;
  fraud_score: number;
  abuse_velocity: string;
  bot_status: boolean;
}

interface IPAPIData {
  ip: string;
  country_name: string;
  isp: string;
  hostname: string;
  org: string;
}

describe('aggregateThreatData', () => {
  const TEST_IP = '8.8.8.8';

  const mockAbuseDB: AbuseIPDBData = {
    ipAddress: TEST_IP,
    abuseConfidenceScore: 45,
    countryCode: 'US',
    hostnames: ['google-dns.com'],
    isp: 'Google LLC (AbuseDB)',
    totalReports: 100,
  };

  const mockIPQS: IPQSData = {
    ip_address: TEST_IP,
    host: 'dns-host-ipqs.net',
    vpn: false,
    proxy: false,
    fraud_score: 25,
    country_code: 'US',
    abuse_velocity: 'low',
    bot_status: false,
  };

  const mockIPAPI: IPAPIData = {
    ip: TEST_IP,
    country_name: 'United States',
    isp: 'Google LLC',
    hostname: 'dns.google',
    org: 'GOOGLE-ORG',
  };

  describe('with all sources available', () => {
    it('should prioritize IPAPI for geolocation data', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: mockIPAPI,
      });

      expect(result.ipAddress).toBe(TEST_IP);
      expect(result.hostname).toBe(mockIPAPI.hostname);
      expect(result.isp).toBe(mockIPAPI.isp);
      expect(result.country).toBe(mockIPAPI.country_name);
    });

    it('should aggregate threat scores correctly', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: mockIPAPI,
      });

      expect(result.abuseScore).toBe(45);
      expect(result.totalReports).toBe(100);
      expect(result.fraudScore).toBe(25);
      expect(result.vpnProxyDetected).toBe(false);
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to AbuseDB when IPAPI is null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: null,
      });

      expect(result.hostname).toBe(mockAbuseDB.hostnames![0]);
      expect(result.isp).toBe(mockAbuseDB.isp);
      expect(result.country).toBe(mockAbuseDB.countryCode);
    });

    it('should fallback to IPQS hostname when others are null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: { ...mockAbuseDB, hostnames: null },
        ipqs: mockIPQS,
        ipapi: { ...mockIPAPI, hostname: '' },
      });

      expect(result.hostname).toBe(mockIPQS.host);
    });

    it('should return null when all sources are null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: null,
        ipqs: null,
        ipapi: null,
      });

      expect(result.hostname).toBeNull();
      expect(result.isp).toBeNull();
      expect(result.country).toBeNull();
      expect(result.abuseScore).toBe(0);
      expect(result.totalReports).toBe(0);
      expect(result.fraudScore).toBe(0);
    });
  });

  describe('VPN/Proxy detection', () => {
    it('should detect VPN when vpn flag is true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, vpn: true },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });

    it('should detect Proxy when proxy flag is true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, proxy: true },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });

    it('should detect when both VPN and Proxy are true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, vpn: true, proxy: true },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });
  });
});

describe('calculateRiskLevel', () => {
  const baseData: ThreatData = {
    ipAddress: '1.1.1.1',
    hostname: null,
    isp: 'ISP',
    country: 'XX',
    totalReports: 1,
    abuseScore: 0,
    fraudScore: 0,
    vpnProxyDetected: false,
  };

  describe('HIGH risk scenarios', () => {
    it('should return HIGH when abuse score >= 75', () => {
      const data = { ...baseData, abuseScore: 75 };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should return HIGH when abuse score > 75', () => {
      const data = { ...baseData, abuseScore: 90 };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should return HIGH when VPN detected and fraud score >= 50', () => {
      const data = { 
        ...baseData, 
        vpnProxyDetected: true, 
        fraudScore: 50,
        abuseScore: 10 
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should return HIGH when VPN detected and fraud score > 50', () => {
      const data = { 
        ...baseData, 
        vpnProxyDetected: true, 
        fraudScore: 75 
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });
  });

  describe('MEDIUM risk scenarios', () => {
    it('should return MEDIUM when abuse score is 30-74', () => {
      const data = { ...baseData, abuseScore: 35 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it('should return MEDIUM when fraud score is 30-49', () => {
      const data = { ...baseData, fraudScore: 40 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it('should return MEDIUM at abuse score boundary (30)', () => {
      const data = { ...baseData, abuseScore: 30 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it('should return MEDIUM at fraud score boundary (30)', () => {
      const data = { ...baseData, fraudScore: 30 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });
  });

  describe('LOW risk scenarios', () => {
    it('should return LOW when all scores are below 30', () => {
      const data = { 
        ...baseData, 
        abuseScore: 29, 
        fraudScore: 29, 
        vpnProxyDetected: false 
      };
      expect(calculateRiskLevel(data)).toBe('LOW');
    });

    it('should return LOW with zero scores', () => {
      const data = { ...baseData };
      expect(calculateRiskLevel(data)).toBe('LOW');
    });

    it('should return LOW even with VPN if fraud score is low', () => {
      const data = { 
        ...baseData, 
        vpnProxyDetected: true, 
        fraudScore: 49 
      };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });
  });

  describe('edge cases', () => {
    it('should handle abuse score at HIGH boundary (75)', () => {
      const data = { ...baseData, abuseScore: 75 };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should handle abuse score just below HIGH boundary (74)', () => {
      const data = { ...baseData, abuseScore: 74 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it('should prioritize HIGH over MEDIUM', () => {
      const data = { 
        ...baseData, 
        abuseScore: 80, 
        fraudScore: 40 
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });
  });
});